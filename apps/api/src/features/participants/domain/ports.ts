import type { Profile } from '@fastkudos/shared';

export interface EventBySlug {
  findBySlug(slug: string): Promise<{ id: string } | null>;
}

export interface ParticipantsRepo {
  listByEvent(eventId: string): Promise<Profile[]>;
}
