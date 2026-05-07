import { describe, expect, it } from 'vitest';
import app from '../index';
import { signJwt } from '../auth/jwt';

const SECRET = 'test-secret-test-secret-test-secret';
const env = { JWT_SECRET: SECRET, DATABASE_URL: 'unused', EVENT_CHANNEL: {} as never };

describe('POST /kudos (borda)', () => {
  it('retorna 401 sem token', async () => {
    const res = await app.request('http://local/kudos', { method: 'POST' }, env);
    expect(res.status).toBe(401);
  });

  it('retorna 400 com body inválido', async () => {
    const token = await signJwt(
      { sub: 'p1', event_id: 'e1', display_name: 'A', is_admin: false },
      SECRET,
      60,
    );
    const res = await app.request(
      'http://local/kudos',
      {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ receiverId: 'not-a-uuid', content: '' }),
      },
      env,
    );
    expect(res.status).toBe(400);
  });
});
