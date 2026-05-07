import { describe, expect, it, vi } from 'vitest';
import { ForbiddenError, NotFoundError, deleteEventAsAdmin } from './delete-event';
import type { EventRepo } from '../domain/ports';
import type { OwnedEventLookup } from './list-event-feedbacks';

function deps(owner: string | null) {
  const lookup: OwnedEventLookup = { ownerOfEvent: async () => owner };
  const repo: EventRepo = {
    existsBySlug: async () => false,
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  return { lookup, repo };
}

describe('deleteEventAsAdmin', () => {
  it('apaga quando admin é dono', async () => {
    const d = deps('a1');
    await deleteEventAsAdmin(
      { events: d.lookup, repo: d.repo },
      { eventId: 'e1', adminId: 'a1' },
    );
    expect(d.repo.delete).toHaveBeenCalledWith('e1');
  });

  it('rejeita NotFound quando evento inexistente', async () => {
    await expect(
      deleteEventAsAdmin(
        { events: deps(null).lookup, repo: deps(null).repo },
        { eventId: 'e1', adminId: 'a1' },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejeita Forbidden quando admin não é dono', async () => {
    const d = deps('outro');
    await expect(
      deleteEventAsAdmin(
        { events: d.lookup, repo: d.repo },
        { eventId: 'e1', adminId: 'a1' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(d.repo.delete).not.toHaveBeenCalled();
  });
});
