import { desc, eq } from 'drizzle-orm';
import type { Event, Feedback } from '@fastkudos/shared';
import type { Database } from '../../../db/client';
import { events, feedbacks, profiles } from '../../../../drizzle/schema';
import type {
  EventRepo,
  FeedbackOwnership,
  ProfileOwnership,
} from '../domain/ports';
import type { OwnedEventsRepo } from '../application/list-owned-events';
import type { AllEventsRepo } from '../application/list-all-events';
import type {
  EventFeedbacksRepo,
  OwnedEventLookup,
} from '../application/list-event-feedbacks';
import type { EventProfilesRepo } from '../application/list-event-profiles';

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
    async update(id, patch) {
      const updated = await db.update(events).set(patch).where(eq(events.id, id)).returning();
      const row = updated[0]!;
      return { id: row.id, slug: row.slug, name: row.name };
    },
    async delete(id) {
      await db.delete(events).where(eq(events.id, id));
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

function rowToEvent(r: typeof events.$inferSelect): Event {
  return {
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    name: r.name,
    slug: r.slug,
    ownerId: r.ownerId,
  };
}

export function ownedEventsRepo(db: Database): OwnedEventsRepo {
  return {
    async listByOwner(ownerId) {
      const rows = await db
        .select()
        .from(events)
        .where(eq(events.ownerId, ownerId))
        .orderBy(desc(events.createdAt));
      return rows.map(rowToEvent);
    },
  };
}

export function allEventsRepo(db: Database): AllEventsRepo {
  return {
    async listAll() {
      const rows = await db.select().from(events).orderBy(desc(events.createdAt));
      return rows.map(rowToEvent);
    },
  };
}

export function ownedEventLookup(db: Database): OwnedEventLookup {
  return {
    async ownerOfEvent(eventId) {
      const rows = await db
        .select({ ownerId: events.ownerId })
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);
      return rows[0]?.ownerId ?? null;
    },
  };
}

export function eventFeedbacksRepo(db: Database): EventFeedbacksRepo {
  return {
    async listByEvent(eventId) {
      const rows = await db
        .select()
        .from(feedbacks)
        .where(eq(feedbacks.eventId, eventId))
        .orderBy(desc(feedbacks.createdAt));
      return rows.map<Feedback>((r) => ({
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        senderId: r.senderId,
        receiverId: r.receiverId,
        eventId: r.eventId,
        content: r.content,
      }));
    },
  };
}

export function eventProfilesRepo(db: Database): EventProfilesRepo {
  return {
    async listByEvent(eventId) {
      const rows = await db
        .select()
        .from(profiles)
        .where(eq(profiles.eventId, eventId))
        .orderBy(desc(profiles.createdAt));
      return rows.map((r) => ({
        id: r.id,
        displayName: r.displayName,
        eventId: r.eventId,
        isAdmin: r.isAdmin,
      }));
    },
  };
}
