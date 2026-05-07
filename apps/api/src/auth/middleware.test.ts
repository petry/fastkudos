import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import {
  requireAuth,
  requireSuperadmin,
  requireUser,
  getUser,
  type AuthContext,
} from './middleware';
import { signJwt } from './jwt';

const SECRET = 'test-secret-test-secret-test-secret';

function buildApp() {
  const app = new Hono<AuthContext>();
  app.use('/me', requireAuth());
  app.get('/me', (c) => c.json(getUser(c)));
  app.use('/owner', requireAuth(), requireUser());
  app.get('/owner', (c) => c.json(getUser(c)));
  app.use('/super', requireAuth(), requireSuperadmin());
  app.get('/super', (c) => c.json(getUser(c)));
  return app;
}

const env = { JWT_SECRET: SECRET, DATABASE_URL: 'unused', EVENT_CHANNEL: {} as never };

describe('requireAuth middleware', () => {
  it('retorna 401 quando header Authorization ausente', async () => {
    const res = await buildApp().request('http://local/me', {}, env);
    expect(res.status).toBe(401);
  });

  it('retorna 401 quando JWT inválido', async () => {
    const res = await buildApp().request(
      'http://local/me',
      { headers: { authorization: 'Bearer not-a-jwt' } },
      env,
    );
    expect(res.status).toBe(401);
  });

  it('popula ctx.user com claims anônimas', async () => {
    const token = await signJwt(
      { sub: 'p1', kind: 'anon', event_id: 'e1', display_name: 'Alice' },
      SECRET,
      60,
    );
    const res = await buildApp().request(
      'http://local/me',
      { headers: { authorization: `Bearer ${token}` } },
      env,
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      kind: 'anon',
      profileId: 'p1',
      eventId: 'e1',
      displayName: 'Alice',
    });
  });

  it('popula ctx.user com claims de logado', async () => {
    const token = await signJwt(
      { sub: 'u1', kind: 'user', role: 'user', event_id: '', display_name: 'Carol' },
      SECRET,
      60,
    );
    const res = await buildApp().request(
      'http://local/me',
      { headers: { authorization: `Bearer ${token}` } },
      env,
    );
    expect(await res.json()).toEqual({
      kind: 'user',
      userId: 'u1',
      role: 'user',
      displayName: 'Carol',
    });
  });
});

describe('requireUser', () => {
  it('rejeita anônimo com 403', async () => {
    const token = await signJwt(
      { sub: 'p1', kind: 'anon', event_id: 'e1', display_name: 'Alice' },
      SECRET,
      60,
    );
    const res = await buildApp().request(
      'http://local/owner',
      { headers: { authorization: `Bearer ${token}` } },
      env,
    );
    expect(res.status).toBe(403);
  });

  it('aceita user logado', async () => {
    const token = await signJwt(
      { sub: 'u1', kind: 'user', role: 'user', event_id: '', display_name: 'Bob' },
      SECRET,
      60,
    );
    const res = await buildApp().request(
      'http://local/owner',
      { headers: { authorization: `Bearer ${token}` } },
      env,
    );
    expect(res.status).toBe(200);
  });
});

describe('requireSuperadmin', () => {
  it('rejeita user comum com 403', async () => {
    const token = await signJwt(
      { sub: 'u1', kind: 'user', role: 'user', event_id: '', display_name: 'Bob' },
      SECRET,
      60,
    );
    const res = await buildApp().request(
      'http://local/super',
      { headers: { authorization: `Bearer ${token}` } },
      env,
    );
    expect(res.status).toBe(403);
  });

  it('aceita superadmin', async () => {
    const token = await signJwt(
      { sub: 'u1', kind: 'user', role: 'superadmin', event_id: '', display_name: 'Root' },
      SECRET,
      60,
    );
    const res = await buildApp().request(
      'http://local/super',
      { headers: { authorization: `Bearer ${token}` } },
      env,
    );
    expect(res.status).toBe(200);
  });
});
