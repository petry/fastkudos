import type { Event, Profile } from '@fastkudos/shared';

export interface EventLookup {
  findBySlug(slug: string): Promise<Event | null>;
}

export interface ProfileRepo {
  create(input: { displayName: string; eventId: string }): Promise<Profile>;
  /**
   * Idempotente para users logados — se já existe profile com (userId, eventId),
   * retorna o existente sem alterar display_name.
   */
  findOrCreateForUser(input: {
    userId: string;
    eventId: string;
    displayName: string;
  }): Promise<Profile>;
}

export interface UserLookup {
  findById(id: string): Promise<{ id: string; name: string } | null>;
}

export interface TokenIssuer {
  issueAnon(input: {
    profileId: string;
    eventId: string;
    displayName: string;
  }): Promise<string>;
}
