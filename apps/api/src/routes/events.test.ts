import { describe, expect, it } from 'vitest';
import app from '../index';

// Borda: garante que GET /events/:slug/profiles exige autenticação.
// Cenários felizes (que tocam DB) ficam para os testes de integração.

describe('GET /events/:slug/profiles (borda)', () => {
  it('retorna 401 sem token', async () => {
    const res = await app.request('http://local/events/demo/profiles');
    expect(res.status).toBe(401);
  });

  it('retorna 401 com token inválido', async () => {
    const res = await app.request('http://local/events/demo/profiles', {
      headers: { authorization: 'Bearer xxx' },
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /events/:slug/stream (borda)', () => {
  it('retorna 426 quando não é upgrade WS', async () => {
    const res = await app.request('http://local/events/demo/stream?token=t');
    expect(res.status).toBe(426);
  });

  it('retorna 401 sem token', async () => {
    const res = await app.request('http://local/events/demo/stream', {
      headers: { Upgrade: 'websocket' },
    });
    expect(res.status).toBe(401);
  });
});
