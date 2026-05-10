import type { Feedback } from '@fastkudos/shared';
import { ForbiddenError, NotFoundError } from '../../../errors/domain';
import type { Actor } from '../domain/actor';

export { ForbiddenError, NotFoundError };

export interface OwnedEventLookup {
  ownerOfEvent(eventId: string): Promise<string | null>;
}

export interface EventFeedbacksRepo {
  listByEvent(eventId: string): Promise<Feedback[]>;
}

export async function listEventFeedbacks(
  deps: { events: OwnedEventLookup; feedbacks: EventFeedbacksRepo },
  cmd: { eventId: string; actor: Actor },
): Promise<Feedback[]> {
  const owner = await deps.events.ownerOfEvent(cmd.eventId);
  if (owner === null) throw new NotFoundError();
  if (cmd.actor.role !== 'superadmin' && owner !== cmd.actor.id) throw new ForbiddenError();
  return deps.feedbacks.listByEvent(cmd.eventId);
}
