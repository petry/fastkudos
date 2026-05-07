import { Hono } from 'hono';
import { submitKudoInput } from '@fastkudos/shared';
import { requireAuth, getUser, type AuthContext } from '../auth/middleware';
import { getDb } from '../db/factory';
import {
  AuthorizationError,
  NotFoundError,
  submitKudo,
} from '../features/kudos/application/submit-kudo';
import { feedbackRepo, profileLookup } from '../features/kudos/infra/repos';
import { durableObjectPublisher } from '../realtime/publisher';

export const kudoRoutes = new Hono<AuthContext>();

kudoRoutes.use('*', requireAuth());

kudoRoutes.post('/', async (c) => {
  const user = getUser(c);
  const body = await c.req.json().catch(() => null);
  const parsed = submitKudoInput.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'invalid_input', issues: parsed.error.issues }, 400);
  }

  const db = getDb(c.env);
  try {
    const feedback = await submitKudo(
      {
        profiles: profileLookup(db),
        feedbacks: feedbackRepo(db),
        realtime: durableObjectPublisher(c.env.EVENT_CHANNEL),
      },
      {
        senderId: user.profileId,
        senderEventId: user.eventId,
        receiverId: parsed.data.receiverId,
        content: parsed.data.content,
      },
    );
    return c.json({ feedback }, 201);
  } catch (e) {
    if (e instanceof NotFoundError) return c.json({ error: 'receiver_not_found' }, 404);
    if (e instanceof AuthorizationError) return c.json({ error: 'forbidden' }, 403);
    throw e;
  }
});
