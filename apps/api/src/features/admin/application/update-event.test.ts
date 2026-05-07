import { describe, expect, it, vi } from 'vitest';
import { ForbiddenError, NotFoundError, SlugTakenError, updateEvent } from './update-event';
import type { EventRepo } from '../domain/ports';
import type { OwnedEventLookup } from './list-event-feedbacks';
import type { Actor } from '../domain/actor';

const owner: Actor = { id: 'a1', role: 'user' };
const intruder: Actor = { id: 'a2', role: 'user' };
const root: Actor = { id: 'super', role: 'superadmin' };

function deps(opts: { owner: string | null; slugTaken?: Set<string> }) {
  const taken = opts.slugTaken ?? new Set<string>();
  const events: OwnedEventLookup = { ownerOfEvent: async () => opts.owner };
  const repo: EventRepo = {
    existsBySlug: async (s) => taken.has(s),
    create: vi.fn(),
    update: vi.fn(async (id, patch) => ({
      id,
      name: patch.name ?? 'old',
      slug: patch.slug ?? 'old-slug',
    })),
    delete: vi.fn(),
  };
  return { lookup: events, repo };
}

describe('updateEvent', () => {
  it('atualiza nome e slug quando dono', async () => {
    const d = deps({ owner: 'a1' });
    const out = await updateEvent(
      { events: d.lookup, repo: d.repo },
      { eventId: 'e1', actor: owner, patch: { name: 'Novo', slug: 'novo' } },
    );
    expect(d.repo.update).toHaveBeenCalledWith('e1', { name: 'Novo', slug: 'novo' });
    expect(out.name).toBe('Novo');
  });

  it('superadmin atualiza evento de terceiros', async () => {
    const d = deps({ owner: 'a1' });
    await updateEvent(
      { events: d.lookup, repo: d.repo },
      { eventId: 'e1', actor: root, patch: { name: 'Mod' } },
    );
    expect(d.repo.update).toHaveBeenCalledWith('e1', { name: 'Mod' });
  });

  it('rejeita NotFound quando evento inexistente', async () => {
    const d = deps({ owner: null });
    await expect(
      updateEvent(
        { events: d.lookup, repo: d.repo },
        { eventId: 'e1', actor: owner, patch: { name: 'X' } },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejeita Forbidden quando não é dono', async () => {
    const d = deps({ owner: 'a1' });
    await expect(
      updateEvent(
        { events: d.lookup, repo: d.repo },
        { eventId: 'e1', actor: intruder, patch: { name: 'X' } },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('rejeita SlugTaken quando novo slug já existe', async () => {
    const d = deps({ owner: 'a1', slugTaken: new Set(['ocupado']) });
    await expect(
      updateEvent(
        { events: d.lookup, repo: d.repo },
        { eventId: 'e1', actor: owner, patch: { slug: 'ocupado' } },
      ),
    ).rejects.toBeInstanceOf(SlugTakenError);
  });

  it('rejeita slug inválido', async () => {
    const d = deps({ owner: 'a1' });
    await expect(
      updateEvent(
        { events: d.lookup, repo: d.repo },
        { eventId: 'e1', actor: owner, patch: { slug: 'NÃO VAI' } },
      ),
    ).rejects.toThrow();
  });

  it('rejeita patch vazio', async () => {
    const d = deps({ owner: 'a1' });
    await expect(
      updateEvent(
        { events: d.lookup, repo: d.repo },
        { eventId: 'e1', actor: owner, patch: {} },
      ),
    ).rejects.toThrow();
  });
});
