import { describe, expect, it } from 'vitest';
import app from '../index';
import { signJwt } from '../auth/jwt';

const SECRET = 'test-secret-test-secret-test-secret';
const env = { JWT_SECRET: SECRET, DATABASE_URL: 'unused', EVENT_CHANNEL: {} as never };

async function adminToken() {
  return signJwt(
    { sub: 'admin-1', event_id: '', display_name: 'admin@x', is_admin: true },
    SECRET,
    60,
  );
}

async function anonToken() {
  return signJwt(
    { sub: 'p1', event_id: 'e1', display_name: 'Alice', is_admin: false },
    SECRET,
    60,
  );
}

describe('rotas /admin (borda)', () => {
  it('POST /admin/events retorna 401 sem token', async () => {
    const res = await app.request('http://local/admin/events', { method: 'POST' }, env);
    expect(res.status).toBe(401);
  });

  it('POST /admin/events retorna 403 quando user não é admin', async () => {
    const res = await app.request(
      'http://local/admin/events',
      {
        method: 'POST',
        headers: { authorization: `Bearer ${await anonToken()}`, 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'X', slug: 'x' }),
      },
      env,
    );
    expect(res.status).toBe(403);
  });

  it('POST /admin/events retorna 400 com input inválido (admin autenticado)', async () => {
    const res = await app.request(
      'http://local/admin/events',
      {
        method: 'POST',
        headers: { authorization: `Bearer ${await adminToken()}`, 'content-type': 'application/json' },
        body: JSON.stringify({ name: '', slug: 'X' }),
      },
      env,
    );
    expect(res.status).toBe(400);
  });

  it('DELETE /admin/feedbacks/:id retorna 403 para não-admin', async () => {
    const res = await app.request(
      'http://local/admin/feedbacks/abc',
      { method: 'DELETE', headers: { authorization: `Bearer ${await anonToken()}` } },
      env,
    );
    expect(res.status).toBe(403);
  });
});

describe('GET /admin/events (borda)', () => {
  it('retorna 401 sem token', async () => {
    const res = await app.request('http://local/admin/events', {}, env);
    expect(res.status).toBe(401);
  });
  it('retorna 403 para não-admin', async () => {
    const res = await app.request(
      'http://local/admin/events',
      { headers: { authorization: `Bearer ${await anonToken()}` } },
      env,
    );
    expect(res.status).toBe(403);
  });
});

describe('GET /admin/events/:id/feedbacks (borda)', () => {
  it('retorna 403 para não-admin', async () => {
    const res = await app.request(
      'http://local/admin/events/x/feedbacks',
      { headers: { authorization: `Bearer ${await anonToken()}` } },
      env,
    );
    expect(res.status).toBe(403);
  });
});

describe('POST /auth/login (borda)', () => {
  it('retorna 400 com input inválido', async () => {
    const res = await app.request('http://local/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'not-email', password: 'x' }),
    });
    expect(res.status).toBe(400);
  });
});
