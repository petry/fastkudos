import { describe, expect, it } from 'vitest';
import type { Feedback } from '@fastkudos/shared';
import { applyMuralEvent } from './reduce';

const fb = (id: string): Feedback => ({
  id,
  createdAt: new Date().toISOString(),
  senderId: 's',
  receiverId: 'r',
  eventId: 'e',
  content: id,
});

describe('applyMuralEvent', () => {
  it('insere novo kudo no topo', () => {
    const result = applyMuralEvent([fb('1')], { type: 'kudo.created', feedback: fb('2') });
    expect(result.map((f) => f.id)).toEqual(['2', '1']);
  });

  it('é idempotente para o mesmo id', () => {
    const initial = [fb('1')];
    const result = applyMuralEvent(initial, { type: 'kudo.created', feedback: fb('1') });
    expect(result).toBe(initial);
  });
});
