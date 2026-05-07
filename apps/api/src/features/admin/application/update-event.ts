import { updateEventInput } from '@fastkudos/shared';
import type { EventRepo } from '../domain/ports';
import type { OwnedEventLookup } from './list-event-feedbacks';

export class NotFoundError extends Error {}
export class ForbiddenError extends Error {}
export class SlugTakenError extends Error {}

export interface UpdateEventDeps {
  events: OwnedEventLookup;
  repo: EventRepo;
}

export async function updateEvent(
  deps: UpdateEventDeps,
  cmd: { eventId: string; adminId: string; patch: { name?: string; slug?: string } },
): Promise<{ id: string; slug: string; name: string }> {
  const patch = updateEventInput.parse(cmd.patch);

  const owner = await deps.events.ownerOfEvent(cmd.eventId);
  if (owner === null) throw new NotFoundError();
  if (owner !== cmd.adminId) throw new ForbiddenError();

  if (patch.slug && (await deps.repo.existsBySlug(patch.slug))) {
    throw new SlugTakenError();
  }

  return deps.repo.update(cmd.eventId, patch);
}
