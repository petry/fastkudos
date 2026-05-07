import type { Profile } from '@fastkudos/shared';
import { ForbiddenError, NotFoundError, type OwnedEventLookup } from './list-event-feedbacks';

export interface EventProfilesRepo {
  listByEvent(eventId: string): Promise<Profile[]>;
}

export async function listEventProfiles(
  deps: { events: OwnedEventLookup; profiles: EventProfilesRepo },
  cmd: { eventId: string; adminId: string },
): Promise<Profile[]> {
  const owner = await deps.events.ownerOfEvent(cmd.eventId);
  if (owner === null) throw new NotFoundError();
  if (owner !== cmd.adminId) throw new ForbiddenError();
  return deps.profiles.listByEvent(cmd.eventId);
}

export { ForbiddenError, NotFoundError };
