import { displayNameSchema, type Profile } from '@fastkudos/shared';
import type { AuthGateway, SessionStore } from '../domain/ports';

export interface JoinEventDeps {
  auth: AuthGateway;
  session: SessionStore;
}

export async function joinEvent(
  deps: JoinEventDeps,
  input: { slug: string; displayName: string },
): Promise<{ token: string; profile: Profile }> {
  const displayName = displayNameSchema.parse(input.displayName);
  const cached = deps.session.load(input.slug);
  if (cached) return cached;

  const session = await deps.auth.registerAnon({ slug: input.slug, displayName });
  deps.session.save(input.slug, session);
  return session;
}
