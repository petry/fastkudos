import { kudoContentSchema, type Feedback } from '@fastkudos/shared';
import { ForbiddenError, NotFoundError } from '../../../errors/domain';
import type { FeedbackRepo, ProfileLookup, RealtimePublisher } from '../domain/ports';

export { ForbiddenError, NotFoundError };
/** @deprecated use ForbiddenError */
export const AuthorizationError = ForbiddenError;

export interface SubmitKudoDeps {
  profiles: ProfileLookup;
  feedbacks: FeedbackRepo;
  realtime: RealtimePublisher;
}

export interface SubmitKudoCommand {
  senderId: string;
  senderEventId: string;
  receiverId: string;
  content: string;
}

export async function submitKudo(deps: SubmitKudoDeps, cmd: SubmitKudoCommand): Promise<Feedback> {
  const content = kudoContentSchema.parse(cmd.content);

  if (cmd.senderId === cmd.receiverId) {
    throw new ForbiddenError('forbidden', 'não é permitido enviar kudo para si mesmo');
  }

  const receiver = await deps.profiles.findById(cmd.receiverId);
  if (!receiver) throw new NotFoundError('receiver_not_found');

  if (receiver.eventId !== cmd.senderEventId) {
    throw new ForbiddenError('forbidden', 'destinatário pertence a outro evento');
  }

  const feedback = await deps.feedbacks.create({
    senderId: cmd.senderId,
    receiverId: cmd.receiverId,
    eventId: cmd.senderEventId,
    content,
  });

  await deps.realtime.publish(cmd.senderEventId, { type: 'kudo.created', feedback });
  return feedback;
}
