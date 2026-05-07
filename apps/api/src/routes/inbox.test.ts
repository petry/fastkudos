import { describe, expect, it } from 'vitest';
import app from '../index';

describe('GET /inbox (borda)', () => {
  it('retorna 401 sem token', async () => {
    const res = await app.request('http://local/inbox');
    expect(res.status).toBe(401);
  });
});
