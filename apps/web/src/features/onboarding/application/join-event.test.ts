import { describe, expect, it, vi } from 'vitest';
import type { Profile } from '@fastkudos/shared';
import { joinEvent } from './join-event';
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
