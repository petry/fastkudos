import type { Event } from '@fastkudos/shared';

export interface OwnedEventsRepo {
  listByOwner(ownerId: string): Promise<Event[]>;
}

export async function listOwnedEvents(
  deps: { events: OwnedEventsRepo },
  cmd: { ownerId: string },
): Promise<Event[]> {
  return deps.events.listByOwner(cmd.ownerId);
}
