import { describe, expect, it, vi } from 'vitest';
import { SlugTakenError, createEvent } from './create-event';
import type { EventRepo } from '../domain/ports';

function repo(taken: Set<string>): EventRepo {
  return {
    existsBySlug: async (s) => taken.has(s),
    create: vi.fn(async (input) => ({ id: 'e1', ...input })),
  };
}

describe('createEvent', () => {
  it('cria evento quando slug livre', async () => {
    const r = repo(new Set());
    const result = await createEvent({ events: r }, { name: 'Demo', slug: 'demo', ownerId: 'a1' });
    expect(result.id).toBe('e1');
    expect(r.create).toHaveBeenCalledWith({ name: 'Demo', slug: 'demo', ownerId: 'a1' });
  });

  it('rejeita SlugTakenError quando slug existe', async () => {
    const r = repo(new Set(['demo']));
    await expect(
      createEvent({ events: r }, { name: 'Demo', slug: 'demo', ownerId: 'a1' }),
    ).rejects.toBeInstanceOf(SlugTakenError);
  });

  it('rejeita slug inválido (validação de domínio)', async () => {
    const r = repo(new Set());
    await expect(
      createEvent({ events: r }, { name: 'Demo', slug: 'NÃO VALIDO', ownerId: 'a1' }),
    ).rejects.toThrow();
  });
});
