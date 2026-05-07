import { eq } from 'drizzle-orm';
import type { Feedback } from '@fastkudos/shared';
import type { Database } from '../../../db/client';
import { feedbacks, profiles } from '../../../../drizzle/schema';
import type { FeedbackRepo, ProfileLookup } from '../domain/ports';

export function profileLookup(db: Database): ProfileLookup {
  return {
    async findById(id) {
      const rows = await db
        .select({ id: profiles.id, eventId: profiles.eventId })
        .from(profiles)
        .where(eq(profiles.id, id))
        .limit(1);
      return rows[0] ?? null;
    },
  };
}

export function feedbackRepo(db: Database): FeedbackRepo {
  return {
    async create(input) {
      const inserted = await db.insert(feedbacks).values(input).returning();
      const row = inserted[0]!;
      const fb: Feedback = {
        id: row.id,
        createdAt: row.createdAt.toISOString(),
        senderId: row.senderId,
        receiverId: row.receiverId,
        eventId: row.eventId,
        content: row.content,
      };
      return fb;
    },
  };
}
