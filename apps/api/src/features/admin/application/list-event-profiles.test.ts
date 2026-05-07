import { describe, expect, it, vi } from 'vitest';
import {
  ForbiddenError,
  NotFoundError,
  listEventProfiles,
  type EventProfilesRepo,
} from './list-event-profiles';
import type { OwnedEventLookup } from './list-event-feedbacks';

function deps(owner: string | null) {
  const events: OwnedEventLookup = { ownerOfEvent: async () => owner };
  const profiles: EventProfilesRepo = { listByEvent: vi.fn(async () => []) };
  return { events, profiles };
}

describe('listEventProfiles', () => {
  it('lista quando admin é dono', async () => {
    const d = deps('a1');
    await listEventProfiles(d, { eventId: 'e1', adminId: 'a1' });
    expect(d.profiles.listByEvent).toHaveBeenCalledWith('e1');
  });

  it('rejeita Forbidden quando outro admin', async () => {
    await expect(
      listEventProfiles(deps('outro'), { eventId: 'e1', adminId: 'a1' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('rejeita NotFound quando evento inexistente', async () => {
    await expect(
      listEventProfiles(deps(null), { eventId: 'e1', adminId: 'a1' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
