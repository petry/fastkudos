import type { Profile } from '@fastkudos/shared';

export interface EventSummary {
  id: string;
  name: string;
  slug: string;
}

export interface EventBySlug {
  findBySlug(slug: string): Promise<EventSummary | null>;
}

export interface ParticipantsRepo {
  listByEvent(eventId: string): Promise<Profile[]>;
}
