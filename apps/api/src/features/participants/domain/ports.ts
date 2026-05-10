import type { EventSummary, Profile } from '@fastkudos/shared';

export type { EventSummary };

export interface EventBySlug {
  findBySlug(slug: string): Promise<EventSummary | null>;
}

export interface ParticipantsRepo {
  listByEvent(eventId: string): Promise<Profile[]>;
}
