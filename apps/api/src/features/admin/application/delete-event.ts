import type { EventRepo } from '../domain/ports';
import type { OwnedEventLookup } from './list-event-feedbacks';
import type { Actor } from '../domain/actor';

export class NotFoundError extends Error {}
export class ForbiddenError extends Error {}

export interface DeleteEventDeps {
  events: OwnedEventLookup;
  repo: EventRepo;
}

export async function deleteEventAsAdmin(
  deps: DeleteEventDeps,
  cmd: { eventId: string; actor: Actor },
): Promise<void> {
  const owner = await deps.events.ownerOfEvent(cmd.eventId);
  if (owner === null) throw new NotFoundError();
  if (cmd.actor.role !== 'superadmin' && owner !== cmd.actor.id) throw new ForbiddenError();
  await deps.repo.delete(cmd.eventId);
}
