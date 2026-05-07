import { describe, expect, it } from 'vitest';
import { InvalidCredentialsError, adminLogin } from './admin-login';
import type { AdminUserRepo } from '../domain/ports';

const repo = (email: string | null): AdminUserRepo => ({
  findByEmail: async (e) =>
    email && e === email
      ? { id: 'a1', email, passwordHash: 'stored' }
      : null,
});

describe('adminLogin', () => {
  it('retorna adminId quando senha confere', async () => {
    const result = await adminLogin(
      { admins: repo('foo@bar.com'), verify: async () => true },
      { email: 'foo@bar.com', password: 'x' },
    );
    expect(result.adminId).toBe('a1');
  });

  it('normaliza email para lowercase', async () => {
    const result = await adminLogin(
      { admins: repo('foo@bar.com'), verify: async () => true },
      { email: 'FOO@BAR.com', password: 'x' },
    );
    expect(result.email).toBe('foo@bar.com');
  });

  it('rejeita quando email não existe', async () => {
    await expect(
      adminLogin(
        { admins: repo(null), verify: async () => true },
        { email: 'x@y', password: 'x' },
      ),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('rejeita quando senha não confere', async () => {
    await expect(
      adminLogin(
        { admins: repo('foo@bar.com'), verify: async () => false },
        { email: 'foo@bar.com', password: 'x' },
      ),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});
