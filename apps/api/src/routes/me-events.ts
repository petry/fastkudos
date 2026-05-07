import { Hono, type Context } from 'hono';
import { createEventInput, updateEventInput } from '@fastkudos/shared';
import { requireAuth, requireUser, getLoggedUser, type AuthContext } from '../auth/middleware';
import { getDb } from '../db/factory';
import { SlugTakenError, createEvent } from '../features/admin/application/create-event';
import {
  ForbiddenError,
  NotFoundError,
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
import {
  ForbiddenError as ListForbidden,
  NotFoundError as ListNotFound,
  listEventFeedbacks,
} from '../features/admin/application/list-event-feedbacks';
import { listEventProfiles } from '../features/admin/application/list-event-profiles';
import {
  ForbiddenError as UpdateForbidden,
  NotFoundError as UpdateNotFound,
  SlugTakenError as UpdateSlugTaken,
  updateEvent,
} from '../features/admin/application/update-event';
import {
  ForbiddenError as DeleteForbidden,
  NotFoundError as DeleteNotFound,
  deleteEventAsAdmin,
} from '../features/admin/application/delete-event';
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
  try {
    const event = await createEvent(
      { events: eventRepo(db) },
      { name: parsed.data.name, slug: parsed.data.slug, ownerId: u.userId },
    );
    return c.json({ event }, 201);
  } catch (e) {
    if (e instanceof SlugTakenError) return c.json({ error: 'slug_taken' }, 409);
    throw e;
  }
});

meEventsRoutes.get('/events/:id/feedbacks', async (c) => {
  const db = getDb(c.env);
  try {
    const feedbacks = await listEventFeedbacks(
      { events: ownedEventLookup(db), feedbacks: eventFeedbacksRepo(db) },
      { eventId: c.req.param('id'), actor: actorFor(c) },
    );
    return c.json({ feedbacks });
  } catch (e) {
    if (e instanceof ListNotFound) return c.json({ error: 'not_found' }, 404);
    if (e instanceof ListForbidden) return c.json({ error: 'forbidden' }, 403);
    throw e;
  }
});

meEventsRoutes.get('/events/:id/profiles', async (c) => {
  const db = getDb(c.env);
  try {
    const profiles = await listEventProfiles(
      { events: ownedEventLookup(db), profiles: eventProfilesRepo(db) },
      { eventId: c.req.param('id'), actor: actorFor(c) },
    );
    return c.json({ profiles });
  } catch (e) {
    if (e instanceof ListNotFound) return c.json({ error: 'not_found' }, 404);
    if (e instanceof ListForbidden) return c.json({ error: 'forbidden' }, 403);
    throw e;
  }
});

meEventsRoutes.patch('/events/:id', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = updateEventInput.safeParse(body);
  if (!parsed.success) return c.json({ error: 'invalid_input' }, 400);

  const db = getDb(c.env);
  try {
    const event = await updateEvent(
      { events: ownedEventLookup(db), repo: eventRepo(db) },
      { eventId: c.req.param('id'), actor: actorFor(c), patch: parsed.data },
    );
    return c.json({ event });
  } catch (e) {
    if (e instanceof UpdateNotFound) return c.json({ error: 'not_found' }, 404);
    if (e instanceof UpdateForbidden) return c.json({ error: 'forbidden' }, 403);
    if (e instanceof UpdateSlugTaken) return c.json({ error: 'slug_taken' }, 409);
    throw e;
  }
});

meEventsRoutes.delete('/events/:id', async (c) => {
  const db = getDb(c.env);
  try {
    await deleteEventAsAdmin(
      { events: ownedEventLookup(db), repo: eventRepo(db) },
      { eventId: c.req.param('id'), actor: actorFor(c) },
    );
    return c.body(null, 204);
  } catch (e) {
    if (e instanceof DeleteNotFound) return c.json({ error: 'not_found' }, 404);
    if (e instanceof DeleteForbidden) return c.json({ error: 'forbidden' }, 403);
    throw e;
  }
});

meEventsRoutes.delete('/feedbacks/:id', async (c) => {
  const db = getDb(c.env);
  try {
    await deleteFeedbackAsAdmin(
      { feedbacks: feedbackOwnership(db) },
      { feedbackId: c.req.param('id'), actor: actorFor(c) },
    );
    return c.body(null, 204);
  } catch (e) {
    if (e instanceof NotFoundError) return c.json({ error: 'not_found' }, 404);
    if (e instanceof ForbiddenError) return c.json({ error: 'forbidden' }, 403);
    throw e;
  }
});

meEventsRoutes.delete('/profiles/:id', async (c) => {
  const db = getDb(c.env);
  try {
    await deleteProfileAsAdmin(
      { profiles: profileOwnership(db) },
      { profileId: c.req.param('id'), actor: actorFor(c) },
    );
    return c.body(null, 204);
  } catch (e) {
    if (e instanceof NotFoundError) return c.json({ error: 'not_found' }, 404);
    if (e instanceof ForbiddenError) return c.json({ error: 'forbidden' }, 403);
    throw e;
  }
});
