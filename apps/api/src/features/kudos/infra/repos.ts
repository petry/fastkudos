import { eq } from 'drizzle-orm';
import type { Database } from '../../../db/client';
import { toFeedback } from '../../../db/mappers';
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
      return toFeedback(inserted[0]!);
    },
  };
}
