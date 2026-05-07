import { describe, expect, it, vi } from 'vitest';
import { ForbiddenError, NotFoundError, deleteEventAsAdmin } from './delete-event';
import type { EventRepo } from '../domain/ports';
import type { OwnedEventLookup } from './list-event-feedbacks';
import type { Actor } from '../domain/actor';

const owner: Actor = { id: 'a1', role: 'user' };
const intruder: Actor = { id: 'a2', role: 'user' };
const root: Actor = { id: 'super', role: 'superadmin' };

function deps(eventOwner: string | null) {
  const lookup: OwnedEventLookup = { ownerOfEvent: async () => eventOwner };
  const repo: EventRepo = {
    existsBySlug: async () => false,
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  return { lookup, repo };
}

describe('deleteEventAsAdmin', () => {
  it('apaga quando dono', async () => {
    const d = deps('a1');
    await deleteEventAsAdmin({ events: d.lookup, repo: d.repo }, { eventId: 'e1', actor: owner });
    expect(d.repo.delete).toHaveBeenCalledWith('e1');
  });

  it('superadmin apaga evento de terceiros', async () => {
    const d = deps('a1');
    await deleteEventAsAdmin({ events: d.lookup, repo: d.repo }, { eventId: 'e1', actor: root });
    expect(d.repo.delete).toHaveBeenCalledWith('e1');
  });

  it('rejeita NotFound quando evento inexistente', async () => {
    const d = deps(null);
    await expect(
      deleteEventAsAdmin({ events: d.lookup, repo: d.repo }, { eventId: 'e1', actor: owner }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejeita Forbidden quando não é dono', async () => {
    const d = deps('a1');
    await expect(
      deleteEventAsAdmin({ events: d.lookup, repo: d.repo }, { eventId: 'e1', actor: intruder }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(d.repo.delete).not.toHaveBeenCalled();
  });
});
