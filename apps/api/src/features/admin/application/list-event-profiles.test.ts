import { describe, expect, it, vi } from 'vitest';
import {
  ForbiddenError,
  NotFoundError,
  listEventProfiles,
  type EventProfilesRepo,
} from './list-event-profiles';
import type { OwnedEventLookup } from './list-event-feedbacks';
import type { Actor } from '../domain/actor';

const owner: Actor = { id: 'a1', role: 'user' };
const intruder: Actor = { id: 'a2', role: 'user' };
const root: Actor = { id: 'super', role: 'superadmin' };

function deps(o: string | null) {
  const events: OwnedEventLookup = { ownerOfEvent: async () => o };
  const profiles: EventProfilesRepo = { listByEvent: vi.fn(async () => []) };
  return { events, profiles };
}

describe('listEventProfiles', () => {
  it('lista quando dono', async () => {
    const d = deps('a1');
    await listEventProfiles(d, { eventId: 'e1', actor: owner });
    expect(d.profiles.listByEvent).toHaveBeenCalledWith('e1');
  });

  it('superadmin lista profiles de evento alheio', async () => {
    const d = deps('a1');
    await listEventProfiles(d, { eventId: 'e1', actor: root });
    expect(d.profiles.listByEvent).toHaveBeenCalledWith('e1');
  });

  it('rejeita Forbidden quando outro user', async () => {
    await expect(
      listEventProfiles(deps('a1'), { eventId: 'e1', actor: intruder }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('rejeita NotFound quando evento inexistente', async () => {
    await expect(
      listEventProfiles(deps(null), { eventId: 'e1', actor: owner }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
