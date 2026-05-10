import { desc, eq } from 'drizzle-orm';
import type { Database } from '../../../db/client';
import { toFeedback } from '../../../db/mappers';
import { feedbacks } from '../../../../drizzle/schema';
import type { MuralRepo } from '../domain/ports';

const MAX_ITEMS = 100;

export function muralRepo(db: Database): MuralRepo {
  return {
    async listByEvent(eventId) {
      const rows = await db
        .select()
        .from(feedbacks)
        .where(eq(feedbacks.eventId, eventId))
        .orderBy(desc(feedbacks.createdAt))
        .limit(MAX_ITEMS);
      return rows.map(toFeedback);
    },
  };
}
