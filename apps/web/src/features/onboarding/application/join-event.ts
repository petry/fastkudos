import { displayNameSchema, type Profile } from '@fastkudos/shared';
import type { AuthGateway, SessionStore } from '../domain/ports';

export interface JoinEventDeps {
  auth: AuthGateway;
  session: SessionStore;
}

type Session = { token: string; profile: Profile };

export async function joinEvent(
  deps: JoinEventDeps,
  input: { slug: string; displayName: string },
): Promise<Session> {
  const displayName = displayNameSchema.parse(input.displayName);
  const cached = deps.session.load(input.slug);
  if (cached) return cached;

  const session = await deps.auth.registerAnon({ slug: input.slug, displayName });
  deps.session.save(input.slug, session);
  return session;
}

export async function joinEventAsUser(
  deps: JoinEventDeps,
  input: { slug: string; userToken: string },
): Promise<Session> {
  const cached = deps.session.load(input.slug);
  if (cached) return cached;

  const session = await deps.auth.eventJoin({ slug: input.slug, userToken: input.userToken });
  deps.session.save(input.slug, session);
  return session;
}
