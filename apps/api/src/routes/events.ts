import { Hono } from 'hono';
import { requireAuth, getUser, type AuthContext } from '../auth/middleware';
import { createDb } from '../db/client';
import {
  ForbiddenError,
  NotFoundError,
  listParticipants,
} from '../features/participants/application/list-participants';
import { eventBySlug, participantsRepo } from '../features/participants/infra/repos';

export const eventRoutes = new Hono<AuthContext>();

eventRoutes.use('*', requireAuth());

eventRoutes.get('/:slug/profiles', async (c) => {
  const user = getUser(c);
  const slug = c.req.param('slug');
  const db = createDb(c.env.DATABASE_URL);

  try {
    const profiles = await listParticipants(
      { events: eventBySlug(db), participants: participantsRepo(db) },
      { slug, callerEventId: user.eventId },
    );
    return c.json({ profiles });
  } catch (e) {
    if (e instanceof NotFoundError) return c.json({ error: 'event_not_found' }, 404);
    if (e instanceof ForbiddenError) return c.json({ error: 'forbidden' }, 403);
    throw e;
  }
});
