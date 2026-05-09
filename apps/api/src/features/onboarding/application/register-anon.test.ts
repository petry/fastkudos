import { describe, expect, it } from 'vitest';
import type { Event, Profile } from '@fastkudos/shared';
import { NotFoundError, registerAnonParticipant } from './register-anon';
import type { EventLookup, ProfileRepo, TokenIssuer } from '../domain/ports';

const fakeEvent: Event = {
  id: 'event-uuid',
  createdAt: new Date().toISOString(),
  name: 'Demo',
  slug: 'demo',
  ownerId: 'owner-uuid',
};

function makeDeps(overrides?: Partial<EventLookup>) {
  const events: EventLookup = {
    findBySlug: overrides?.findBySlug ?? (async (slug) => (slug === 'demo' ? fakeEvent : null)),
  };
  const created: Profile[] = [];
  const profiles: ProfileRepo = {
    create: async ({ displayName, eventId }) => {
      const p: Profile = {
        id: 'profile-uuid',
        displayName,
        eventId,
        isAdmin: false,
        avatarUrl: null,
      };
      created.push(p);
      return p;
    },
    findOrCreateForUser: async () => {
      throw new Error('não usado neste teste');
    },
  };
  const issued: Array<{ profileId: string; eventId: string; displayName: string }> = [];
  const tokens: TokenIssuer = {
    issueAnon: async (input) => {
      issued.push(input);
      return `tok.${input.profileId}`;
    },
  };
  return { deps: { events, profiles, tokens }, created, issued };
}

describe('registerAnonParticipant', () => {
  it('cria profile e emite token quando o evento existe', async () => {
    const { deps, created, issued } = makeDeps();
    const result = await registerAnonParticipant(deps, { slug: 'demo', displayName: 'Alice' });

    expect(result.token).toBe('tok.profile-uuid');
    expect(result.profile.displayName).toBe('Alice');
    expect(result.profile.eventId).toBe('event-uuid');
    expect(created).toHaveLength(1);
    expect(issued[0]).toEqual({
      profileId: 'profile-uuid',
      eventId: 'event-uuid',
      displayName: 'Alice',
    });
  });

  it('faz trim do displayName antes de persistir', async () => {
    const { deps, created } = makeDeps();
    await registerAnonParticipant(deps, { slug: 'demo', displayName: '  Bob  ' });
    expect(created[0]?.displayName).toBe('Bob');
  });

  it('lança NotFoundError quando o slug não existe', async () => {
    const { deps } = makeDeps();
    await expect(
      registerAnonParticipant(deps, { slug: 'inexistente', displayName: 'Alice' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejeita displayName inválido (validação de domínio)', async () => {
    const { deps } = makeDeps();
    await expect(
      registerAnonParticipant(deps, { slug: 'demo', displayName: '   ' }),
    ).rejects.toThrow();
  });
});
