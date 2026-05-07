import { and, desc, eq } from 'drizzle-orm';
import type { Feedback } from '@fastkudos/shared';
import type { Database } from '../../../db/client';
import { feedbacks } from '../../../../drizzle/schema';
import type { InboxRepo } from '../domain/ports';

export function inboxRepo(db: Database): InboxRepo {
  return {
    async listForReceiver({ receiverId, eventId }) {
      const rows = await db
        .select()
        .from(feedbacks)
        .where(and(eq(feedbacks.receiverId, receiverId), eq(feedbacks.eventId, eventId)))
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
