import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth, requireSuperadmin, type AuthContext } from '../auth/middleware';
import { getDb } from '../db/factory';
import { listAllEvents } from '../features/admin/application/list-all-events';
import { allEventsRepo } from '../features/admin/infra/repos';
import {
  LastSuperadminError,
  NotFoundError,
  updateUserRole,
} from '../features/auth/application/update-user-role';
import { userRepo } from '../features/auth/infra/repos';

const updateRoleInput = z.object({
  role: z.enum(['user', 'superadmin']),
});

export const superadminRoutes = new Hono<AuthContext>();

superadminRoutes.use('*', requireAuth(), requireSuperadmin());

superadminRoutes.get('/events', async (c) => {
  const db = getDb(c.env);
  const events = await listAllEvents({ events: allEventsRepo(db) });
  return c.json({ events });
});

superadminRoutes.get('/users', async (c) => {
  const db = getDb(c.env);
  const all = await userRepo(db).listAll();
  const items = all.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    avatarUrl: u.avatarUrl,
    role: u.role,
    oauthProvider: u.oauthProvider,
  }));
  return c.json({ users: items });
});

superadminRoutes.patch('/users/:id', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = updateRoleInput.safeParse(body);
  if (!parsed.success) return c.json({ error: 'invalid_input' }, 400);

  const db = getDb(c.env);
  try {
    const user = await updateUserRole(
      { users: userRepo(db) },
      { userId: c.req.param('id'), role: parsed.data.role },
    );
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    });
  } catch (e) {
    if (e instanceof NotFoundError) return c.json({ error: 'not_found' }, 404);
    if (e instanceof LastSuperadminError) return c.json({ error: 'last_superadmin' }, 409);
    throw e;
  }
});
