import type { Event } from '@fastkudos/shared';

export interface AllEventsRepo {
  listAll(): Promise<Event[]>;
}

export async function listAllEvents(deps: { events: AllEventsRepo }): Promise<Event[]> {
  return deps.events.listAll();
}
