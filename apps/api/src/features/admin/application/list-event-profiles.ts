import type { Profile } from '@fastkudos/shared';
import { ForbiddenError, NotFoundError, type OwnedEventLookup } from './list-event-feedbacks';
import type { Actor } from '../domain/actor';

export interface EventProfilesRepo {
  listByEvent(eventId: string): Promise<Profile[]>;
}

export async function listEventProfiles(
  deps: { events: OwnedEventLookup; profiles: EventProfilesRepo },
  cmd: { eventId: string; actor: Actor },
): Promise<Profile[]> {
  const owner = await deps.events.ownerOfEvent(cmd.eventId);
  if (owner === null) throw new NotFoundError();
  if (cmd.actor.role !== 'superadmin' && owner !== cmd.actor.id) throw new ForbiddenError();
  return deps.profiles.listByEvent(cmd.eventId);
}

export { ForbiddenError, NotFoundError };
