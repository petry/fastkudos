import type { Profile } from '@fastkudos/shared';
import type { EventBySlug, EventSummary, ParticipantsRepo } from '../domain/ports';

export class NotFoundError extends Error {}
export class ForbiddenError extends Error {}

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
  if (!event) throw new NotFoundError('evento não encontrado');
  if (event.id !== cmd.callerEventId) throw new ForbiddenError('cross-event');
  const profiles = await deps.participants.listByEvent(event.id);
  return { event, profiles };
}
