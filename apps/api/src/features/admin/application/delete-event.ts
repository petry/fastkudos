import type { EventRepo } from '../domain/ports';
import type { OwnedEventLookup } from './list-event-feedbacks';

export class NotFoundError extends Error {}
export class ForbiddenError extends Error {}

export interface DeleteEventDeps {
  events: OwnedEventLookup;
  repo: EventRepo;
}

export async function deleteEventAsAdmin(
  deps: DeleteEventDeps,
  cmd: { eventId: string; adminId: string },
): Promise<void> {
  const owner = await deps.events.ownerOfEvent(cmd.eventId);
  if (owner === null) throw new NotFoundError();
  if (owner !== cmd.adminId) throw new ForbiddenError();
  await deps.repo.delete(cmd.eventId);
}
