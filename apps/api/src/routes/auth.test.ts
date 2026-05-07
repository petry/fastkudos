import { describe, expect, it } from 'vitest';
import app from '../index';
import { verifyJwt } from '../auth/jwt';

// Smoke da borda HTTP: valida formato de erro quando input é inválido.
// Os caminhos felizes que tocam DB são exercitados nos testes de integração.

describe('POST /auth/anon (borda)', () => {
  it('retorna 400 quando body é inválido', async () => {
    const res = await app.request('http://local/auth/anon', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug: 'X', displayName: '' }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('invalid_input');
  });

  it('retorna 400 quando body não é JSON', async () => {
    const res = await app.request('http://local/auth/anon', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not-json',
    });
    expect(res.status).toBe(400);
  });
});

describe('jwt anon (formato)', () => {
  it('JWT emitido para anon contém claims esperados', async () => {
    const { signJwt } = await import('../auth/jwt');
    const secret = 'test-secret-test-secret-test-secret';
    const token = await signJwt(
      { sub: 'p1', kind: 'anon', event_id: 'e1', display_name: 'Alice' },
      secret,
      60,
    );
    const claims = await verifyJwt(token, secret);
    expect(claims.kind).toBe('anon');
    expect(claims.event_id).toBe('e1');
  });
});
