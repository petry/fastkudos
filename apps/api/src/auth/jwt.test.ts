import { describe, expect, it } from 'vitest';
import { signJwt, verifyJwt } from './jwt';

const secret = 'test-secret-test-secret-test-secret';

describe('jwt', () => {
  it('faz round-trip de claims anônimas', async () => {
    const token = await signJwt(
      { sub: 'p1', kind: 'anon', event_id: 'e1', display_name: 'Alice' },
      secret,
      60,
    );
    const claims = await verifyJwt(token, secret);
    expect(claims.sub).toBe('p1');
    expect(claims.kind).toBe('anon');
    expect(claims.event_id).toBe('e1');
  });

  it('faz round-trip de claims de usuário logado com role', async () => {
    const token = await signJwt(
      { sub: 'u1', kind: 'user', role: 'superadmin', event_id: '', display_name: 'Bob' },
      secret,
      60,
    );
    const claims = await verifyJwt(token, secret);
    expect(claims.kind).toBe('user');
    expect(claims.role).toBe('superadmin');
  });

  it('rejeita assinatura com segredo diferente', async () => {
    const token = await signJwt(
      { sub: 'p1', kind: 'anon', event_id: 'e1', display_name: 'Alice' },
      secret,
      60,
    );
    await expect(verifyJwt(token, 'outro-segredo')).rejects.toThrow();
  });

  it('rejeita token expirado', async () => {
    const token = await signJwt(
      { sub: 'p1', kind: 'anon', event_id: 'e1', display_name: 'Alice' },
      secret,
      -1,
    );
    await expect(verifyJwt(token, secret)).rejects.toThrow(/expirado/);
  });
});
