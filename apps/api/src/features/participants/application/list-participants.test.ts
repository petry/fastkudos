import { describe, expect, it } from 'vitest';
import type { Profile } from '@fastkudos/shared';
import { ForbiddenError, NotFoundError, listParticipants } from './list-participants';
import type { EventBySlug, ParticipantsRepo } from '../domain/ports';

const profiles: Profile[] = [
  { id: 'p1', displayName: 'Alice', eventId: 'e1', isAdmin: false },
  { id: 'p2', displayName: 'Bob', eventId: 'e1', isAdmin: false },
];

function deps(overrides?: { findBySlug?: EventBySlug['findBySlug'] }) {
  const events: EventBySlug = {
    findBySlug:
      overrides?.findBySlug ??
      (async (s) =>
        s === 'demo' ? { id: 'e1', name: 'Evento Demo', slug: 'demo' } : null),
  };
  const participants: ParticipantsRepo = {
    listByEvent: async (eid) => (eid === 'e1' ? profiles : []),
  };
  return { events, participants };
}

describe('listParticipants', () => {
  it('retorna evento e participantes quando caller pertence a ele', async () => {
    const result = await listParticipants(deps(), { slug: 'demo', callerEventId: 'e1' });
    expect(result.event).toEqual({ id: 'e1', name: 'Evento Demo', slug: 'demo' });
    expect(result.profiles).toHaveLength(2);
  });

  it('rejeita com ForbiddenError quando caller pertence a outro evento', async () => {
    await expect(
      listParticipants(deps(), { slug: 'demo', callerEventId: 'e-OUTRO' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('rejeita com NotFoundError quando o slug não existe', async () => {
    await expect(
      listParticipants(deps(), { slug: 'nope', callerEventId: 'e1' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
