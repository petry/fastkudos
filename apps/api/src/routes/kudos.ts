import { Hono } from 'hono';
import { submitKudoInput } from '@fastkudos/shared';
import { requireAuth, requireAnon, getAnonUser, type AuthContext } from '../auth/middleware';
import { getDb } from '../db/factory';
import { submitKudo } from '../features/kudos/application/submit-kudo';
import { feedbackRepo, profileLookup } from '../features/kudos/infra/repos';
import { durableObjectPublisher } from '../realtime/publisher';

export const kudoRoutes = new Hono<AuthContext>();

kudoRoutes.use('*', requireAuth(), requireAnon());

kudoRoutes.post('/', async (c) => {
  const user = getAnonUser(c);
  const body = await c.req.json().catch(() => null);
  const parsed = submitKudoInput.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'invalid_input', issues: parsed.error.issues }, 400);
  }

  const db = getDb(c.env);
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
});
