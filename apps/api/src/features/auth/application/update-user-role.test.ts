import { describe, expect, it } from 'vitest';
import { LastSuperadminError, NotFoundError, updateUserRole } from './update-user-role';
import type { UserRecord } from '../domain/oauth-profile';
import type { UserRepo } from '../domain/ports';

function fakeRepo(initial: UserRecord[]): UserRepo {
  const data = new Map<string, UserRecord>();
  for (const u of initial) data.set(u.id, u);
  return {
    async findById(id) {
      return data.get(id) ?? null;
    },
    async findByProviderSub() {
      return null;
    },
    async findByEmail() {
      return null;
    },
    async create() {
      throw new Error('not used');
    },
    async promoteLegacy() {
      throw new Error('not used');
    },
    async refreshProfile() {
      throw new Error('not used');
    },
    async listAll() {
      return Array.from(data.values());
    },
    async countSuperadmins() {
      return Array.from(data.values()).filter((u) => u.role === 'superadmin').length;
    },
    async updateRole(id, role) {
      const cur = data.get(id);
      if (!cur) throw new Error('not found');
      const next: UserRecord = { ...cur, role };
      data.set(id, next);
      return next;
    },
  };
}

const u = (id: string, role: 'user' | 'superadmin'): UserRecord => ({
  id,
  email: `${id}@x`,
  name: id,
  avatarUrl: null,
  role,
  oauthProvider: 'google',
  oauthSub: `sub-${id}`,
});

describe('updateUserRole', () => {
  it('promove user para superadmin', async () => {
    const users = fakeRepo([u('a', 'user'), u('b', 'superadmin')]);
    const out = await updateUserRole({ users }, { userId: 'a', role: 'superadmin' });
    expect(out.role).toBe('superadmin');
  });

  it('rebaixa superadmin quando há outros superadmins', async () => {
    const users = fakeRepo([u('a', 'superadmin'), u('b', 'superadmin')]);
    const out = await updateUserRole({ users }, { userId: 'a', role: 'user' });
    expect(out.role).toBe('user');
  });

  it('rejeita rebaixar último superadmin', async () => {
    const users = fakeRepo([u('a', 'superadmin'), u('b', 'user')]);
    await expect(
      updateUserRole({ users }, { userId: 'a', role: 'user' }),
    ).rejects.toBeInstanceOf(LastSuperadminError);
  });

  it('NotFound quando user inexistente', async () => {
    const users = fakeRepo([]);
    await expect(
      updateUserRole({ users }, { userId: 'x', role: 'user' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('é noop quando role atual já bate com o pedido', async () => {
    const users = fakeRepo([u('a', 'user')]);
    const out = await updateUserRole({ users }, { userId: 'a', role: 'user' });
    expect(out.role).toBe('user');
  });
});
