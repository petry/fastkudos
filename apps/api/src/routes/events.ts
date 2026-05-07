import { Hono } from 'hono';
import { requireAuth, getUser, type AuthContext } from '../auth/middleware';
import { verifyJwt } from '../auth/jwt';
import { getDb } from '../db/factory';
import {
  ForbiddenError,
  NotFoundError,
  listParticipants,
} from '../features/participants/application/list-participants';
import { eventBySlug, participantsRepo } from '../features/participants/infra/repos';

export const eventRoutes = new Hono<AuthContext>();

// Stream WS é montado antes do requireAuth porque a auth chega pela query string
// (browsers não enviam Authorization no upgrade WebSocket).
eventRoutes.get('/:slug/stream', async (c) => {
  if (c.req.header('Upgrade') !== 'websocket') {
    return c.json({ error: 'expected_websocket' }, 426);
  }
  const token = c.req.query('token');
  if (!token) return c.json({ error: 'unauthorized' }, 401);

  let claims;
  try {
    claims = await verifyJwt(token, c.env.JWT_SECRET);
  } catch {
    return c.json({ error: 'unauthorized' }, 401);
  }

  const slug = c.req.param('slug');
  const db = getDb(c.env);
  const event = await eventBySlug(db).findBySlug(slug);
  if (!event) return c.json({ error: 'event_not_found' }, 404);
  if (event.id !== claims.event_id) return c.json({ error: 'forbidden' }, 403);

  const stub = c.env.EVENT_CHANNEL.get(c.env.EVENT_CHANNEL.idFromName(event.id));
  return stub.fetch('https://channel/connect', { headers: { Upgrade: 'websocket' } });
});

eventRoutes.use('*', requireAuth());

eventRoutes.get('/:slug/profiles', async (c) => {
  const user = getUser(c);
  const slug = c.req.param('slug');
  const db = getDb(c.env);

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
