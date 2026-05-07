import type { Feedback } from '@fastkudos/shared';

export interface InboxRepo {
  listForReceiver(input: { receiverId: string; eventId: string }): Promise<Feedback[]>;
}
