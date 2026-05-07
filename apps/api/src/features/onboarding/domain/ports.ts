import type { Event, Profile } from '@fastkudos/shared';

export interface EventLookup {
  findBySlug(slug: string): Promise<Event | null>;
}

export interface ProfileRepo {
  create(input: { displayName: string; eventId: string }): Promise<Profile>;
}

export interface TokenIssuer {
  issueAnon(input: {
    profileId: string;
    eventId: string;
    displayName: string;
  }): Promise<string>;
}
