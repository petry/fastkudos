import { Hono } from 'hono';
import { anonAuthInput } from '@fastkudos/shared';
import type { Env } from '../index';
import { createDb } from '../db/client';
import { signJwt } from '../auth/jwt';
import { NotFoundError, registerAnonParticipant } from '../features/onboarding/application/register-anon';
import { eventLookup, profileRepo } from '../features/onboarding/infra/repos';

const ANON_TTL_SECONDS = 60 * 60 * 24 * 30;

export const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.post('/anon', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = anonAuthInput.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'invalid_input', issues: parsed.error.issues }, 400);
  }

  const db = createDb(c.env.DATABASE_URL);
  const secret = c.env.JWT_SECRET;

  try {
    const result = await registerAnonParticipant(
      {
        events: eventLookup(db),
        profiles: profileRepo(db),
        tokens: {
          issueAnon: ({ profileId, eventId, displayName }) =>
            signJwt(
              { sub: profileId, event_id: eventId, display_name: displayName, is_admin: false },
              secret,
              ANON_TTL_SECONDS,
            ),
        },
      },
      parsed.data,
    );
    return c.json(result, 201);
  } catch (e) {
    if (e instanceof NotFoundError) return c.json({ error: 'event_not_found' }, 404);
    throw e;
  }
});
