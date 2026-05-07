import type { Feedback } from '@fastkudos/shared';

export class NotFoundError extends Error {}
export class ForbiddenError extends Error {}

export interface OwnedEventLookup {
  ownerOfEvent(eventId: string): Promise<string | null>;
}

export interface EventFeedbacksRepo {
  listByEvent(eventId: string): Promise<Feedback[]>;
}

export async function listEventFeedbacks(
  deps: { events: OwnedEventLookup; feedbacks: EventFeedbacksRepo },
  cmd: { eventId: string; adminId: string },
): Promise<Feedback[]> {
  const owner = await deps.events.ownerOfEvent(cmd.eventId);
  if (owner === null) throw new NotFoundError();
  if (owner !== cmd.adminId) throw new ForbiddenError();
  return deps.feedbacks.listByEvent(cmd.eventId);
}
