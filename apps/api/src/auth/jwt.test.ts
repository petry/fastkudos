import { describe, expect, it } from 'vitest';
import { signJwt, verifyJwt } from './jwt';

const secret = 'test-secret-test-secret-test-secret';

describe('jwt', () => {
  it('faz round-trip de claims', async () => {
    const token = await signJwt(
      { sub: 'p1', event_id: 'e1', display_name: 'Alice', is_admin: false },
      secret,
      60,
    );
    const claims = await verifyJwt(token, secret);
    expect(claims.sub).toBe('p1');
    expect(claims.event_id).toBe('e1');
    expect(claims.is_admin).toBe(false);
  });

  it('rejeita assinatura com segredo diferente', async () => {
    const token = await signJwt(
      { sub: 'p1', event_id: 'e1', display_name: 'Alice', is_admin: false },
      secret,
      60,
    );
    await expect(verifyJwt(token, 'outro-segredo')).rejects.toThrow();
  });

  it('rejeita token expirado', async () => {
    const token = await signJwt(
      { sub: 'p1', event_id: 'e1', display_name: 'Alice', is_admin: false },
      secret,
      -1,
    );
    await expect(verifyJwt(token, secret)).rejects.toThrow(/expirado/);
  });
});
