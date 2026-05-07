import { Hono } from 'hono';
import { requireAuth, getUser, type AuthContext } from '../auth/middleware';
import { getDb } from '../db/factory';
import { getMural } from '../features/mural/application/get-mural';
import { muralRepo } from '../features/mural/infra/repos';

export const muralRoutes = new Hono<AuthContext>();

muralRoutes.use('*', requireAuth());

muralRoutes.get('/', async (c) => {
  const user = getUser(c);
  const db = getDb(c.env);
  const feedbacks = await getMural(
    { mural: muralRepo(db) },
    { callerEventId: user.eventId },
  );
  return c.json({ feedbacks });
});
