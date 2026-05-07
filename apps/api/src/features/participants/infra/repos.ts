import { eq } from 'drizzle-orm';
import type { Profile } from '@fastkudos/shared';
import type { Database } from '../../../db/client';
import { events, profiles } from '../../../../drizzle/schema';
import type { EventBySlug, ParticipantsRepo } from '../domain/ports';

export function eventBySlug(db: Database): EventBySlug {
  return {
    async findBySlug(slug) {
      const rows = await db.select({ id: events.id }).from(events).where(eq(events.slug, slug)).limit(1);
      return rows[0] ?? null;
    },
  };
}

export function participantsRepo(db: Database): ParticipantsRepo {
  return {
    async listByEvent(eventId) {
      const rows = await db.select().from(profiles).where(eq(profiles.eventId, eventId));
      return rows.map<Profile>((r) => ({
        id: r.id,
        displayName: r.displayName,
        eventId: r.eventId,
        isAdmin: r.isAdmin,
      }));
    },
  };
}
