import { describe, expect, it, vi } from 'vitest';
import {
  ForbiddenError,
  NotFoundError,
  listEventFeedbacks,
  type EventFeedbacksRepo,
  type OwnedEventLookup,
} from './list-event-feedbacks';
import type { Actor } from '../domain/actor';

const owner: Actor = { id: 'a1', role: 'user' };
const intruder: Actor = { id: 'a2', role: 'user' };
const root: Actor = { id: 'super', role: 'superadmin' };

function deps(o: string | null) {
  const events: OwnedEventLookup = { ownerOfEvent: async () => o };
  const feedbacks: EventFeedbacksRepo = { listByEvent: vi.fn(async () => []) };
  return { events, feedbacks };
}

describe('listEventFeedbacks', () => {
  it('retorna feedbacks quando dono', async () => {
    const d = deps('a1');
    await listEventFeedbacks(d, { eventId: 'e1', actor: owner });
    expect(d.feedbacks.listByEvent).toHaveBeenCalledWith('e1');
  });

  it('superadmin lê feedbacks de evento alheio', async () => {
    const d = deps('a1');
    await listEventFeedbacks(d, { eventId: 'e1', actor: root });
    expect(d.feedbacks.listByEvent).toHaveBeenCalledWith('e1');
  });

  it('rejeita Forbidden quando não é dono', async () => {
    await expect(
      listEventFeedbacks(deps('a1'), { eventId: 'e1', actor: intruder }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('rejeita NotFound quando evento inexistente', async () => {
    await expect(
      listEventFeedbacks(deps(null), { eventId: 'e1', actor: owner }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
