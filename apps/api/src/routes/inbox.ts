import { Hono } from 'hono';
import { requireAuth, getUser, type AuthContext } from '../auth/middleware';
import { createDb } from '../db/client';
import { getInbox } from '../features/inbox/application/get-inbox';
import { inboxRepo } from '../features/inbox/infra/repos';

export const inboxRoutes = new Hono<AuthContext>();

inboxRoutes.use('*', requireAuth());

inboxRoutes.get('/', async (c) => {
  const user = getUser(c);
  const db = createDb(c.env.DATABASE_URL);
  const feedbacks = await getInbox(
    { inbox: inboxRepo(db) },
    { callerProfileId: user.profileId, callerEventId: user.eventId },
  );
  return c.json({ feedbacks });
});
