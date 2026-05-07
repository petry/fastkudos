import { Hono } from 'hono';
import { requireAuth, requireAnon, getAnonUser, type AuthContext } from '../auth/middleware';
import { getDb } from '../db/factory';
import { getInbox } from '../features/inbox/application/get-inbox';
import { inboxRepo } from '../features/inbox/infra/repos';

export const inboxRoutes = new Hono<AuthContext>();

inboxRoutes.use('*', requireAuth(), requireAnon());

inboxRoutes.get('/', async (c) => {
  const user = getAnonUser(c);
  const db = getDb(c.env);
  const feedbacks = await getInbox(
    { inbox: inboxRepo(db) },
    { callerProfileId: user.profileId, callerEventId: user.eventId },
  );
  return c.json({ feedbacks });
});
