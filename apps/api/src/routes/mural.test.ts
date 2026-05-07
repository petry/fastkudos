import { describe, expect, it } from 'vitest';
import app from '../index';

describe('GET /mural (borda)', () => {
  it('retorna 401 sem token', async () => {
    const res = await app.request('http://local/mural');
    expect(res.status).toBe(401);
  });
});
