import { describe, expect, it, vi } from 'vitest';
import type { Feedback } from '@fastkudos/shared';
import { getInbox } from './get-inbox';
import type { InboxRepo } from '../domain/ports';

describe('getInbox', () => {
  it('escopa busca por receiverId e eventId do caller', async () => {
    const list: Feedback[] = [
      {
        id: 'f1',
        createdAt: new Date().toISOString(),
        senderId: 's',
        receiverId: 'me',
        eventId: 'e1',
        content: 'oi',
      },
    ];
    const inbox: InboxRepo = { listForReceiver: vi.fn(async () => list) };
    const result = await getInbox({ inbox }, { callerProfileId: 'me', callerEventId: 'e1' });
    expect(result).toEqual(list);
    expect(inbox.listForReceiver).toHaveBeenCalledWith({ receiverId: 'me', eventId: 'e1' });
  });
});
