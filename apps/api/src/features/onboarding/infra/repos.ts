import { eq } from 'drizzle-orm';
import type { Event, Profile } from '@fastkudos/shared';
import type { Database } from '../../../db/client';
import { events, profiles } from '../../../../drizzle/schema';
import type { EventLookup, ProfileRepo } from '../domain/ports';

export function eventLookup(db: Database): EventLookup {
  return {
    async findBySlug(slug) {
      const rows = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
      const row = rows[0];
      if (!row) return null;
      return toEvent(row);
    },
  };
}

export function profileRepo(db: Database): ProfileRepo {
  return {
    async create({ displayName, eventId }) {
      const inserted = await db
        .insert(profiles)
        .values({ displayName, eventId })
        .returning();
      return toProfile(inserted[0]!);
    },
  };
}

function toEvent(row: typeof events.$inferSelect): Event {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    name: row.name,
    slug: row.slug,
    ownerId: row.ownerId,
  };
}

function toProfile(row: typeof profiles.$inferSelect): Profile {
  return {
    id: row.id,
    displayName: row.displayName,
    eventId: row.eventId,
    isAdmin: row.isAdmin,
  };
}
