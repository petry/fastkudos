import type { Feedback } from '@fastkudos/shared';
import type { InboxRepo } from '../domain/ports';

export interface GetInboxDeps {
  inbox: InboxRepo;
}

export interface GetInboxCommand {
  callerProfileId: string;
  callerEventId: string;
}

export async function getInbox(deps: GetInboxDeps, cmd: GetInboxCommand): Promise<Feedback[]> {
  return deps.inbox.listForReceiver({
    receiverId: cmd.callerProfileId,
    eventId: cmd.callerEventId,
  });
}
