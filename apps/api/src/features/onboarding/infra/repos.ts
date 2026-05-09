import { and, eq } from 'drizzle-orm';
import type { Event, Profile } from '@fastkudos/shared';
import type { Database } from '../../../db/client';
import { events, profiles, users } from '../../../../drizzle/schema';
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
      return toProfile(inserted[0]!, null);
    },
    async findOrCreateForUser({ userId, eventId, displayName }) {
      await db
        .insert(profiles)
        .values({ userId, eventId, displayName })
        .onConflictDoNothing({ target: [profiles.userId, profiles.eventId] });
      const rows = await db
        .select({ profile: profiles, avatarUrl: users.avatarUrl })
        .from(profiles)
        .leftJoin(users, eq(users.id, profiles.userId))
        .where(and(eq(profiles.userId, userId), eq(profiles.eventId, eventId)))
        .limit(1);
      const row = rows[0]!;
      return toProfile(row.profile, row.avatarUrl);
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

function toProfile(row: typeof profiles.$inferSelect, avatarUrl: string | null): Profile {
  return {
    id: row.id,
    displayName: row.displayName,
    eventId: row.eventId,
    isAdmin: row.isAdmin,
    avatarUrl,
  };
}
