import { Hono, type Context } from 'hono';
import { createEventInput, updateEventInput } from '@fastkudos/shared';
import { requireAuth, requireUser, getLoggedUser, type AuthContext } from '../auth/middleware';
import { getDb } from '../db/factory';
import { createEvent } from '../features/admin/application/create-event';
import {
  deleteFeedbackAsAdmin,
  deleteProfileAsAdmin,
} from '../features/admin/application/moderate';
import {
  eventRepo,
  feedbackOwnership,
  profileOwnership,
  ownedEventsRepo,
  ownedEventLookup,
  eventFeedbacksRepo,
  eventProfilesRepo,
} from '../features/admin/infra/repos';
import { listOwnedEvents } from '../features/admin/application/list-owned-events';
import { listEventFeedbacks } from '../features/admin/application/list-event-feedbacks';
import { listEventProfiles } from '../features/admin/application/list-event-profiles';
import { updateEvent } from '../features/admin/application/update-event';
import { deleteEventAsAdmin } from '../features/admin/application/delete-event';
import type { Actor } from '../features/admin/domain/actor';

export const meEventsRoutes = new Hono<AuthContext>();

meEventsRoutes.use('*', requireAuth(), requireUser());

function actorFor(c: Context<AuthContext>): Actor {
  const u = getLoggedUser(c);
  return { id: u.userId, role: u.role };
}

meEventsRoutes.get('/events', async (c) => {
  const u = getLoggedUser(c);
  const db = getDb(c.env);
  const events = await listOwnedEvents({ events: ownedEventsRepo(db) }, { ownerId: u.userId });
  return c.json({ events });
});

meEventsRoutes.post('/events', async (c) => {
  const u = getLoggedUser(c);
  const body = await c.req.json().catch(() => null);
  const parsed = createEventInput.safeParse(body);
  if (!parsed.success) return c.json({ error: 'invalid_input' }, 400);

  const db = getDb(c.env);
  const event = await createEvent(
    { events: eventRepo(db) },
    { name: parsed.data.name, slug: parsed.data.slug, ownerId: u.userId },
  );
  return c.json({ event }, 201);
});

meEventsRoutes.get('/events/:id/feedbacks', async (c) => {
  const db = getDb(c.env);
  const feedbacks = await listEventFeedbacks(
    { events: ownedEventLookup(db), feedbacks: eventFeedbacksRepo(db) },
    { eventId: c.req.param('id'), actor: actorFor(c) },
  );
  return c.json({ feedbacks });
});

meEventsRoutes.get('/events/:id/profiles', async (c) => {
  const db = getDb(c.env);
  const profiles = await listEventProfiles(
    { events: ownedEventLookup(db), profiles: eventProfilesRepo(db) },
    { eventId: c.req.param('id'), actor: actorFor(c) },
  );
  return c.json({ profiles });
});

meEventsRoutes.patch('/events/:id', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = updateEventInput.safeParse(body);
  if (!parsed.success) return c.json({ error: 'invalid_input' }, 400);

  const db = getDb(c.env);
  const event = await updateEvent(
    { events: ownedEventLookup(db), repo: eventRepo(db) },
    { eventId: c.req.param('id'), actor: actorFor(c), patch: parsed.data },
  );
  return c.json({ event });
});

meEventsRoutes.delete('/events/:id', async (c) => {
  const db = getDb(c.env);
  await deleteEventAsAdmin(
    { events: ownedEventLookup(db), repo: eventRepo(db) },
    { eventId: c.req.param('id'), actor: actorFor(c) },
  );
  return c.body(null, 204);
});

meEventsRoutes.delete('/feedbacks/:id', async (c) => {
  const db = getDb(c.env);
  await deleteFeedbackAsAdmin(
    { feedbacks: feedbackOwnership(db) },
    { feedbackId: c.req.param('id'), actor: actorFor(c) },
  );
  return c.body(null, 204);
});

meEventsRoutes.delete('/profiles/:id', async (c) => {
  const db = getDb(c.env);
  await deleteProfileAsAdmin(
    { profiles: profileOwnership(db) },
    { profileId: c.req.param('id'), actor: actorFor(c) },
  );
  return c.body(null, 204);
});
