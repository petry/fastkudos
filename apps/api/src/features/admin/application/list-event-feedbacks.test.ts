import { describe, expect, it, vi } from 'vitest';
import {
  ForbiddenError,
  NotFoundError,
  listEventFeedbacks,
  type EventFeedbacksRepo,
  type OwnedEventLookup,
} from './list-event-feedbacks';

function deps(owner: string | null) {
  const events: OwnedEventLookup = { ownerOfEvent: async () => owner };
  const feedbacks: EventFeedbacksRepo = { listByEvent: vi.fn(async () => []) };
  return { events, feedbacks };
}

describe('listEventFeedbacks', () => {
  it('retorna feedbacks quando admin é dono', async () => {
    const d = deps('a1');
    await listEventFeedbacks(d, { eventId: 'e1', adminId: 'a1' });
    expect(d.feedbacks.listByEvent).toHaveBeenCalledWith('e1');
  });

  it('rejeita Forbidden quando admin não é dono', async () => {
    await expect(
      listEventFeedbacks(deps('outro'), { eventId: 'e1', adminId: 'a1' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('rejeita NotFound quando evento inexistente', async () => {
    await expect(
      listEventFeedbacks(deps(null), { eventId: 'e1', adminId: 'a1' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
