import { describe, expect, it, vi } from 'vitest';
import type { Event } from '@fastkudos/shared';
import { listOwnedEvents, type OwnedEventsRepo } from './list-owned-events';

describe('listOwnedEvents', () => {
  it('repassa ownerId para o repositório', async () => {
    const events: Event[] = [];
    const repo: OwnedEventsRepo = { listByOwner: vi.fn(async () => events) };
    const result = await listOwnedEvents({ events: repo }, { ownerId: 'a1' });
    expect(repo.listByOwner).toHaveBeenCalledWith('a1');
    expect(result).toBe(events);
  });
});
