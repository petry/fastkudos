import { eq } from 'drizzle-orm';
import type { Database } from '../../../db/client';
import { adminUsers, events, feedbacks, profiles } from '../../../../drizzle/schema';
import type {
  AdminUserRepo,
  EventRepo,
  FeedbackOwnership,
  ProfileOwnership,
} from '../domain/ports';

export function adminUserRepo(db: Database): AdminUserRepo {
  return {
    async findByEmail(email) {
      const rows = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
      const row = rows[0];
      return row ? { id: row.id, email: row.email, passwordHash: row.passwordHash } : null;
    },
  };
}

export function eventRepo(db: Database): EventRepo {
  return {
    async existsBySlug(slug) {
      const rows = await db.select({ id: events.id }).from(events).where(eq(events.slug, slug)).limit(1);
      return rows.length > 0;
    },
    async create({ name, slug, ownerId }) {
      const inserted = await db.insert(events).values({ name, slug, ownerId }).returning();
      const row = inserted[0]!;
      return { id: row.id, slug: row.slug, name: row.name };
    },
  };
}

export function feedbackOwnership(db: Database): FeedbackOwnership {
  return {
    async ownerOfFeedback(feedbackId) {
      const rows = await db
        .select({ ownerId: events.ownerId })
        .from(feedbacks)
        .innerJoin(events, eq(events.id, feedbacks.eventId))
        .where(eq(feedbacks.id, feedbackId))
        .limit(1);
      return rows[0]?.ownerId ?? null;
    },
    async delete(feedbackId) {
      await db.delete(feedbacks).where(eq(feedbacks.id, feedbackId));
    },
  };
}

export function profileOwnership(db: Database): ProfileOwnership {
  return {
    async ownerOfProfile(profileId) {
      const rows = await db
        .select({ ownerId: events.ownerId })
        .from(profiles)
        .innerJoin(events, eq(events.id, profiles.eventId))
        .where(eq(profiles.id, profileId))
        .limit(1);
      return rows[0]?.ownerId ?? null;
    },
    async delete(profileId) {
      await db.delete(profiles).where(eq(profiles.id, profileId));
    },
  };
}
