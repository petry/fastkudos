import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { requireAuth, getUser, type AuthContext } from './middleware';
import { signJwt } from './jwt';

const SECRET = 'test-secret-test-secret-test-secret';

function buildApp() {
  const app = new Hono<AuthContext>();
  app.use('/me', requireAuth());
  app.get('/me', (c) => c.json(getUser(c)));
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

  it('popula ctx.user com claims quando JWT válido', async () => {
    const token = await signJwt(
      { sub: 'p1', event_id: 'e1', display_name: 'Alice', is_admin: false },
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
      profileId: 'p1',
      eventId: 'e1',
      displayName: 'Alice',
      isAdmin: false,
    });
  });
});
