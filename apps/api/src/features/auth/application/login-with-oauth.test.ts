import { describe, expect, it } from 'vitest';
import { loginWithOauth } from './login-with-oauth';
import type { OauthProfile, UserRecord } from '../domain/oauth-profile';
import type { UserRepo } from '../domain/ports';

function fakeRepo(initial: UserRecord[] = []): UserRepo & { all: () => UserRecord[] } {
  const data = new Map<string, UserRecord>();
  for (const u of initial) data.set(u.id, u);
  let nextId = initial.length + 1;
  return {
    all: () => Array.from(data.values()),
    async findById(id) {
      return data.get(id) ?? null;
    },
    async findByProviderSub(provider, sub) {
      for (const u of data.values()) {
        if (u.oauthProvider === provider && u.oauthSub === sub) return u;
      }
      return null;
    },
    async findByEmail(email) {
      for (const u of data.values()) if (u.email === email) return u;
      return null;
    },
    async create(input) {
      const u: UserRecord = {
        id: `u-${nextId++}`,
        email: input.email,
        name: input.name,
        avatarUrl: input.avatarUrl,
        role: 'user',
        oauthProvider: input.oauthProvider,
        oauthSub: input.oauthSub,
      };
      data.set(u.id, u);
      return u;
    },
    async promoteLegacy(id, patch) {
      const cur = data.get(id);
      if (!cur) throw new Error('not found');
      const next: UserRecord = { ...cur, ...patch };
      data.set(id, next);
      return next;
    },
    async refreshProfile(id, patch) {
      const cur = data.get(id);
      if (!cur) throw new Error('not found');
      const next: UserRecord = { ...cur, name: patch.name, avatarUrl: patch.avatarUrl };
      data.set(id, next);
      return next;
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

const profile: OauthProfile = {
  provider: 'google',
  sub: 'google-123',
  email: 'alice@example.com',
  name: 'Alice',
  avatarUrl: 'https://avatar/a.png',
};

describe('loginWithOauth', () => {
  it('cria novo user quando não existe match', async () => {
    const users = fakeRepo();
    const u = await loginWithOauth({ users }, profile);
    expect(u.email).toBe('alice@example.com');
    expect(u.role).toBe('user');
    expect(u.oauthProvider).toBe('google');
    expect(u.oauthSub).toBe('google-123');
    expect(users.all()).toHaveLength(1);
  });

  it('reusa user existente por (provider, sub)', async () => {
    const users = fakeRepo([
      {
        id: 'u-1',
        email: 'alice@example.com',
        name: 'Alice',
        avatarUrl: profile.avatarUrl,
        role: 'user',
        oauthProvider: 'google',
        oauthSub: 'google-123',
      },
    ]);
    const u = await loginWithOauth({ users }, profile);
    expect(u.id).toBe('u-1');
    expect(users.all()).toHaveLength(1);
  });

  it('atualiza nome/avatar quando perfil mudou no provider', async () => {
    const users = fakeRepo([
      {
        id: 'u-1',
        email: 'alice@example.com',
        name: 'Alice Antigo',
        avatarUrl: 'https://avatar/old.png',
        role: 'user',
        oauthProvider: 'google',
        oauthSub: 'google-123',
      },
    ]);
    const u = await loginWithOauth({ users }, profile);
    expect(u.name).toBe('Alice');
    expect(u.avatarUrl).toBe('https://avatar/a.png');
  });

  it('promove legacy admin (preserva id e role superadmin)', async () => {
    const users = fakeRepo([
      {
        id: 'u-legacy',
        email: 'alice@example.com',
        name: 'alice@example.com',
        avatarUrl: null,
        role: 'superadmin',
        oauthProvider: 'legacy',
        oauthSub: 'u-legacy',
      },
    ]);
    const u = await loginWithOauth({ users }, profile);
    expect(u.id).toBe('u-legacy');
    expect(u.role).toBe('superadmin');
    expect(u.oauthProvider).toBe('google');
    expect(u.oauthSub).toBe('google-123');
    expect(u.name).toBe('Alice');
  });

  it('não confunde user de outro provider com mesmo email', async () => {
    // (cenário futuro) — quando email já está em uso por github, login google cria conta nova
    const users = fakeRepo([
      {
        id: 'u-1',
        email: 'alice@example.com',
        name: 'Alice GH',
        avatarUrl: null,
        role: 'user',
        // provider 'google' mas sub diferente: simula um user real distinto
        oauthProvider: 'google',
        oauthSub: 'outro-sub',
      },
    ]);
    const u = await loginWithOauth({ users }, profile);
    // como findByProviderSub falha, cai em findByEmail, mas só promove se for legacy.
    // user existente não é legacy → cria novo.
    expect(u.id).not.toBe('u-1');
    expect(users.all()).toHaveLength(2);
  });
});
