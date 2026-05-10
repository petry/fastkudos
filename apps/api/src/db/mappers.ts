import type { Event, Feedback, Profile } from '@fastkudos/shared';
import type { events, feedbacks, profiles } from '../../drizzle/schema';

export function toFeedback(row: typeof feedbacks.$inferSelect): Feedback {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    senderId: row.senderId,
    receiverId: row.receiverId,
    eventId: row.eventId,
    content: row.content,
  };
}

export function toEvent(row: typeof events.$inferSelect): Event {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    name: row.name,
    slug: row.slug,
    ownerId: row.ownerId,
  };
}

export function toProfile(
  row: typeof profiles.$inferSelect,
  avatarUrl: string | null,
): Profile {
  return {
    id: row.id,
    displayName: row.displayName,
    eventId: row.eventId,
    isAdmin: row.isAdmin,
    avatarUrl,
  };
}
