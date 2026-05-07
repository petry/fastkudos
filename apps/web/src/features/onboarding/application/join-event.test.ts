import { describe, expect, it, vi } from 'vitest';
import type { Profile } from '@fastkudos/shared';
import { joinEvent, joinEventAsUser } from './join-event';
import type { AuthGateway, SessionStore } from '../domain/ports';

function makeProfile(overrides?: Partial<Profile>): Profile {
  return {
    id: 'p1',
    displayName: 'Alice',
    eventId: 'e1',
    isAdmin: false,
    ...overrides,
  };
}

function makeDeps(loadResult: { token: string; profile: Profile } | null = null) {
  const store: Record<string, { token: string; profile: Profile }> = {};
  const session: SessionStore = {
    save: vi.fn((slug, s) => {
      store[slug] = s;
    }),
    load: vi.fn(() => loadResult),
  };
  const auth: AuthGateway = {
    registerAnon: vi.fn(async ({ displayName }) => ({
      token: 'tok-123',
      profile: makeProfile({ displayName }),
    })),
    eventJoin: vi.fn(async ({ slug }) => ({
      token: 'tok-user',
      profile: makeProfile({ id: 'p-user', displayName: 'Alice Login', eventId: slug }),
    })),
  };
  return { deps: { auth, session }, store };
}

describe('joinEvent', () => {
  it('chama gateway, grava sessão e retorna token+profile', async () => {
    const { deps } = makeDeps();
    const result = await joinEvent(deps, { slug: 'demo', displayName: 'Alice' });
    expect(result.token).toBe('tok-123');
    expect(result.profile.displayName).toBe('Alice');
    expect(deps.session.save).toHaveBeenCalledWith('demo', result);
  });

  it('reaproveita sessão em cache (sem nova chamada ao gateway)', async () => {
    const cached = { token: 'cached', profile: makeProfile({ id: 'cached-p' }) };
    const { deps } = makeDeps(cached);
    const result = await joinEvent(deps, { slug: 'demo', displayName: 'Alice' });
    expect(result).toBe(cached);
    expect(deps.auth.registerAnon).not.toHaveBeenCalled();
  });

  it('rejeita displayName vazio', async () => {
    const { deps } = makeDeps();
    await expect(joinEvent(deps, { slug: 'demo', displayName: '   ' })).rejects.toThrow();
  });
});

describe('joinEventAsUser', () => {
  it('chama gateway com userToken e grava sessão', async () => {
    const { deps } = makeDeps();
    const result = await joinEventAsUser(deps, { slug: 'demo', userToken: 'jwt-user' });
    expect(deps.auth.eventJoin).toHaveBeenCalledWith({ slug: 'demo', userToken: 'jwt-user' });
    expect(deps.session.save).toHaveBeenCalledWith('demo', result);
    expect(result.token).toBe('tok-user');
  });

  it('reaproveita sessão em cache sem chamar o gateway', async () => {
    const cached = { token: 'cached', profile: makeProfile({ id: 'cached-p' }) };
    const { deps } = makeDeps(cached);
    const result = await joinEventAsUser(deps, { slug: 'demo', userToken: 'jwt-user' });
    expect(result).toBe(cached);
    expect(deps.auth.eventJoin).not.toHaveBeenCalled();
  });
});
