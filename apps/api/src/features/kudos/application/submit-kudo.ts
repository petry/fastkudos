import { kudoContentSchema, type Feedback } from '@fastkudos/shared';
import type { FeedbackRepo, ProfileLookup, RealtimePublisher } from '../domain/ports';

export class AuthorizationError extends Error {}
export class NotFoundError extends Error {}

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
    throw new AuthorizationError('não é permitido enviar kudo para si mesmo');
  }

  const receiver = await deps.profiles.findById(cmd.receiverId);
  if (!receiver) throw new NotFoundError('destinatário não encontrado');

  if (receiver.eventId !== cmd.senderEventId) {
    throw new AuthorizationError('destinatário pertence a outro evento');
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
