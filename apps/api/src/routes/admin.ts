import { Hono } from 'hono';
import { createEventInput, updateEventInput } from '@fastkudos/shared';
import { requireAuth, requireAdmin, getUser, type AuthContext } from '../auth/middleware';
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

export const adminRoutes = new Hono<AuthContext>();

adminRoutes.use('*', requireAuth(), requireAdmin());

adminRoutes.get('/events', async (c) => {
  const user = getUser(c);
  const db = getDb(c.env);
  const events = await listOwnedEvents({ events: ownedEventsRepo(db) }, { ownerId: user.profileId });
  return c.json({ events });
});

adminRoutes.get('/events/:id/feedbacks', async (c) => {
  const user = getUser(c);
  const db = getDb(c.env);
  try {
    const feedbacks = await listEventFeedbacks(
      { events: ownedEventLookup(db), feedbacks: eventFeedbacksRepo(db) },
      { eventId: c.req.param('id'), adminId: user.profileId },
    );
    return c.json({ feedbacks });
  } catch (e) {
    if (e instanceof ListNotFound) return c.json({ error: 'not_found' }, 404);
    if (e instanceof ListForbidden) return c.json({ error: 'forbidden' }, 403);
    throw e;
  }
});

adminRoutes.get('/events/:id/profiles', async (c) => {
  const user = getUser(c);
  const db = getDb(c.env);
  try {
    const profiles = await listEventProfiles(
      { events: ownedEventLookup(db), profiles: eventProfilesRepo(db) },
      { eventId: c.req.param('id'), adminId: user.profileId },
    );
    return c.json({ profiles });
  } catch (e) {
    if (e instanceof ListNotFound) return c.json({ error: 'not_found' }, 404);
    if (e instanceof ListForbidden) return c.json({ error: 'forbidden' }, 403);
    throw e;
  }
});

adminRoutes.post('/events', async (c) => {
  const user = getUser(c);
  const body = await c.req.json().catch(() => null);
  const parsed = createEventInput.safeParse(body);
  if (!parsed.success) return c.json({ error: 'invalid_input' }, 400);

  const db = getDb(c.env);
  try {
    const event = await createEvent(
      { events: eventRepo(db) },
      { name: parsed.data.name, slug: parsed.data.slug, ownerId: user.profileId },
    );
    return c.json({ event }, 201);
  } catch (e) {
    if (e instanceof SlugTakenError) return c.json({ error: 'slug_taken' }, 409);
    throw e;
  }
});

adminRoutes.patch('/events/:id', async (c) => {
  const user = getUser(c);
  const body = await c.req.json().catch(() => null);
  const parsed = updateEventInput.safeParse(body);
  if (!parsed.success) return c.json({ error: 'invalid_input' }, 400);

  const db = getDb(c.env);
  try {
    const event = await updateEvent(
      { events: ownedEventLookup(db), repo: eventRepo(db) },
      { eventId: c.req.param('id'), adminId: user.profileId, patch: parsed.data },
    );
    return c.json({ event });
  } catch (e) {
    if (e instanceof UpdateNotFound) return c.json({ error: 'not_found' }, 404);
    if (e instanceof UpdateForbidden) return c.json({ error: 'forbidden' }, 403);
    if (e instanceof UpdateSlugTaken) return c.json({ error: 'slug_taken' }, 409);
    throw e;
  }
});

adminRoutes.delete('/events/:id', async (c) => {
  const user = getUser(c);
  const db = getDb(c.env);
  try {
    await deleteEventAsAdmin(
      { events: ownedEventLookup(db), repo: eventRepo(db) },
      { eventId: c.req.param('id'), adminId: user.profileId },
    );
    return c.body(null, 204);
  } catch (e) {
    if (e instanceof DeleteNotFound) return c.json({ error: 'not_found' }, 404);
    if (e instanceof DeleteForbidden) return c.json({ error: 'forbidden' }, 403);
    throw e;
  }
});

adminRoutes.delete('/feedbacks/:id', async (c) => {
  const user = getUser(c);
  const db = getDb(c.env);
  try {
    await deleteFeedbackAsAdmin(
      { feedbacks: feedbackOwnership(db) },
      { feedbackId: c.req.param('id'), adminId: user.profileId },
    );
    return c.body(null, 204);
  } catch (e) {
    if (e instanceof NotFoundError) return c.json({ error: 'not_found' }, 404);
    if (e instanceof ForbiddenError) return c.json({ error: 'forbidden' }, 403);
    throw e;
  }
});

adminRoutes.delete('/profiles/:id', async (c) => {
  const user = getUser(c);
  const db = getDb(c.env);
  try {
    await deleteProfileAsAdmin(
      { profiles: profileOwnership(db) },
      { profileId: c.req.param('id'), adminId: user.profileId },
    );
    return c.body(null, 204);
  } catch (e) {
    if (e instanceof NotFoundError) return c.json({ error: 'not_found' }, 404);
    if (e instanceof ForbiddenError) return c.json({ error: 'forbidden' }, 403);
    throw e;
  }
});
