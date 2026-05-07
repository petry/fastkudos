import { Hono } from 'hono';
import { createEventInput } from '@fastkudos/shared';
import { requireAuth, requireAdmin, getUser, type AuthContext } from '../auth/middleware';
import { createDb } from '../db/client';
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
} from '../features/admin/infra/repos';

export const adminRoutes = new Hono<AuthContext>();

adminRoutes.use('*', requireAuth(), requireAdmin());

adminRoutes.post('/events', async (c) => {
  const user = getUser(c);
  const body = await c.req.json().catch(() => null);
  const parsed = createEventInput.safeParse(body);
  if (!parsed.success) return c.json({ error: 'invalid_input' }, 400);

  const db = createDb(c.env.DATABASE_URL);
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

adminRoutes.delete('/feedbacks/:id', async (c) => {
  const user = getUser(c);
  const db = createDb(c.env.DATABASE_URL);
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
  const db = createDb(c.env.DATABASE_URL);
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
