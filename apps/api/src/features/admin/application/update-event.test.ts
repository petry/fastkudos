import { describe, expect, it, vi } from 'vitest';
import { ForbiddenError, NotFoundError, SlugTakenError, updateEvent } from './update-event';
import type { EventRepo } from '../domain/ports';
import type { OwnedEventLookup } from './list-event-feedbacks';

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
  it('atualiza nome e slug quando admin é dono', async () => {
    const d = deps({ owner: 'a1' });
    const out = await updateEvent(
      { events: d.lookup, repo: d.repo },
      { eventId: 'e1', adminId: 'a1', patch: { name: 'Novo', slug: 'novo' } },
    );
    expect(d.repo.update).toHaveBeenCalledWith('e1', { name: 'Novo', slug: 'novo' });
    expect(out.name).toBe('Novo');
    expect(out.slug).toBe('novo');
  });

  it('atualiza apenas nome', async () => {
    const d = deps({ owner: 'a1' });
    await updateEvent(
      { events: d.lookup, repo: d.repo },
      { eventId: 'e1', adminId: 'a1', patch: { name: 'Só Nome' } },
    );
    expect(d.repo.update).toHaveBeenCalledWith('e1', { name: 'Só Nome' });
  });

  it('rejeita NotFound quando evento inexistente', async () => {
    const d = deps({ owner: null });
    await expect(
      updateEvent(
        { events: d.lookup, repo: d.repo },
        { eventId: 'e1', adminId: 'a1', patch: { name: 'X' } },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejeita Forbidden quando admin não é dono', async () => {
    const d = deps({ owner: 'outro' });
    await expect(
      updateEvent(
        { events: d.lookup, repo: d.repo },
        { eventId: 'e1', adminId: 'a1', patch: { name: 'X' } },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('rejeita SlugTaken quando novo slug já existe', async () => {
    const d = deps({ owner: 'a1', slugTaken: new Set(['ocupado']) });
    await expect(
      updateEvent(
        { events: d.lookup, repo: d.repo },
        { eventId: 'e1', adminId: 'a1', patch: { slug: 'ocupado' } },
      ),
    ).rejects.toBeInstanceOf(SlugTakenError);
  });

  it('rejeita slug inválido (validação de domínio)', async () => {
    const d = deps({ owner: 'a1' });
    await expect(
      updateEvent(
        { events: d.lookup, repo: d.repo },
        { eventId: 'e1', adminId: 'a1', patch: { slug: 'NÃO VAI' } },
      ),
    ).rejects.toThrow();
  });

  it('rejeita patch vazio', async () => {
    const d = deps({ owner: 'a1' });
    await expect(
      updateEvent(
        { events: d.lookup, repo: d.repo },
        { eventId: 'e1', adminId: 'a1', patch: {} },
      ),
    ).rejects.toThrow();
  });
});
