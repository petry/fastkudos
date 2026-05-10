import { describe, expect, it } from 'vitest';
import type { Event, Profile } from '@fastkudos/shared';
import { NotFoundError, registerUserParticipant } from './register-user-participant';
import type { EventLookup, ProfileRepo, TokenIssuer, UserLookup } from '../domain/ports';

const fakeEvent: Event = {
  id: 'event-uuid',
  createdAt: new Date().toISOString(),
  name: 'Demo',
  slug: 'demo',
  ownerId: 'owner-uuid',
};

function makeDeps(opts?: {
  user?: { id: string; name: string } | null;
  existing?: Profile;
  event?: Event;
}) {
  const event = opts?.event ?? fakeEvent;
  const events: EventLookup = {
    findBySlug: async (slug) => (slug === event.slug ? event : null),
  };
  const users: UserLookup = {
    findById: async (id) => opts?.user ?? (id === 'user-1' ? { id: 'user-1', name: 'Alice Login' } : null),
  };
  const calls: Array<{ userId: string; eventId: string; displayName: string; isAdmin: boolean }> = [];
  const profiles: ProfileRepo = {
    create: async () => {
      throw new Error('não deve ser chamado pelo fluxo de user logado');
    },
    findOrCreateForUser: async ({ userId, eventId, displayName, isAdmin }) => {
      calls.push({ userId, eventId, displayName, isAdmin });
      if (opts?.existing) return { ...opts.existing, isAdmin };
      const p: Profile = {
        id: `profile-${userId}-${eventId}`,
        displayName,
        eventId,
        isAdmin,
        avatarUrl: null,
      };
      return p;
    },
  };
  const issued: Array<{ profileId: string; eventId: string; displayName: string }> = [];
  const tokens: TokenIssuer = {
    issueAnon: async (input) => {
      issued.push(input);
      return `tok.${input.profileId}`;
    },
  };
  return { deps: { events, profiles, users, tokens }, calls, issued };
}

describe('registerUserParticipant', () => {
  it('cria profile com user_id e display_name vindo de users.name', async () => {
    const { deps, calls, issued } = makeDeps();
    const result = await registerUserParticipant(deps, { slug: 'demo', userId: 'user-1' });

    expect(calls).toEqual([
      { userId: 'user-1', eventId: 'event-uuid', displayName: 'Alice Login', isAdmin: false },
    ]);
    expect(result.profile.displayName).toBe('Alice Login');
    expect(result.profile.eventId).toBe('event-uuid');
    expect(result.token).toBe('tok.profile-user-1-event-uuid');
    expect(issued[0]?.displayName).toBe('Alice Login');
  });

  it('marca isAdmin=true quando o user é dono do evento', async () => {
    const { deps, calls } = makeDeps({
      user: { id: 'owner-uuid', name: 'Dona' },
      event: { ...fakeEvent, ownerId: 'owner-uuid' },
    });
    const result = await registerUserParticipant(deps, { slug: 'demo', userId: 'owner-uuid' });
    expect(calls[0]?.isAdmin).toBe(true);
    expect(result.profile.isAdmin).toBe(true);
  });

  it('promove profile existente para isAdmin=true se o user é dono', async () => {
    const existing: Profile = {
      id: 'profile-existing',
      displayName: 'Dona',
      eventId: 'event-uuid',
      isAdmin: false,
      avatarUrl: null,
    };
    const { deps } = makeDeps({
      user: { id: 'owner-uuid', name: 'Dona' },
      event: { ...fakeEvent, ownerId: 'owner-uuid' },
      existing,
    });
    const result = await registerUserParticipant(deps, { slug: 'demo', userId: 'owner-uuid' });
    expect(result.profile.isAdmin).toBe(true);
  });

  it('é idempotente — retorna profile existente sem trocar nome', async () => {
    const existing: Profile = {
      id: 'profile-existing',
      displayName: 'Alice Old',
      eventId: 'event-uuid',
      isAdmin: false,
      avatarUrl: null,
    };
    const { deps } = makeDeps({ existing });
    const result = await registerUserParticipant(deps, { slug: 'demo', userId: 'user-1' });
    expect(result.profile.id).toBe('profile-existing');
    expect(result.profile.displayName).toBe('Alice Old');
  });

  it('lança NotFoundError quando o slug não existe', async () => {
    const { deps } = makeDeps();
    await expect(
      registerUserParticipant(deps, { slug: 'nope', userId: 'user-1' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('lança NotFoundError quando o user não existe (defesa em profundidade)', async () => {
    const { deps } = makeDeps({ user: null });
    await expect(
      registerUserParticipant(deps, { slug: 'demo', userId: 'desaparecido' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
