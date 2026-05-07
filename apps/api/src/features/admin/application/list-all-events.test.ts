import { describe, expect, it, vi } from 'vitest';
import type { Event } from '@fastkudos/shared';
import { listAllEvents, type AllEventsRepo } from './list-all-events';

describe('listAllEvents', () => {
  it('delega para o repo', async () => {
    const events: Event[] = [];
    const repo: AllEventsRepo = { listAll: vi.fn(async () => events) };
    const result = await listAllEvents({ events: repo });
    expect(repo.listAll).toHaveBeenCalled();
    expect(result).toBe(events);
  });
});
