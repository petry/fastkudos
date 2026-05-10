import type { SessionStore } from '../domain/ports';
import type { LoggedSessionStore } from '../../admin/domain/ports';

export interface SignOutDeps {
  session: SessionStore;
  userSession?: LoggedSessionStore;
}

export function signOutFromEvent({ session, userSession }: SignOutDeps, slug: string): void {
  session.clear(slug);
  userSession?.clear();
}
