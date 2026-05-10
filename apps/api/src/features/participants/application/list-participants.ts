import type { Profile } from '@fastkudos/shared';
import { ForbiddenError, NotFoundError } from '../../../errors/domain';
import type { EventBySlug, EventSummary, ParticipantsRepo } from '../domain/ports';

export { ForbiddenError, NotFoundError };

export interface ListParticipantsDeps {
  events: EventBySlug;
  participants: ParticipantsRepo;
}

export interface ListParticipantsCommand {
  slug: string;
  callerEventId: string;
}

export interface ListParticipantsResult {
  event: EventSummary;
  profiles: Profile[];
}

export async function listParticipants(
  deps: ListParticipantsDeps,
  cmd: ListParticipantsCommand,
): Promise<ListParticipantsResult> {
  const event = await deps.events.findBySlug(cmd.slug);
  if (!event) throw new NotFoundError('event_not_found');
  if (event.id !== cmd.callerEventId) throw new ForbiddenError('forbidden', 'cross-event');
  const profiles = await deps.participants.listByEvent(event.id);
  return { event, profiles };
}
