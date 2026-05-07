import { describe, expect, it, vi } from 'vitest';
import type { Feedback } from '@fastkudos/shared';
import { getMural } from './get-mural';
import type { MuralRepo } from '../domain/ports';

describe('getMural', () => {
  it('escopa busca por eventId do caller', async () => {
    const list: Feedback[] = [
      {
        id: 'f1',
        createdAt: new Date().toISOString(),
        senderId: 's',
        receiverId: 'r',
        eventId: 'e1',
        content: 'oi',
      },
    ];
    const mural: MuralRepo = { listByEvent: vi.fn(async () => list) };
    const result = await getMural({ mural }, { callerEventId: 'e1' });
    expect(result).toEqual(list);
    expect(mural.listByEvent).toHaveBeenCalledWith('e1');
  });
});
