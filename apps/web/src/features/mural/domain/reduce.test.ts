import { describe, expect, it } from 'vitest';
import type { Feedback } from '@fastkudos/shared';
import { applyMuralEvent } from './reduce';

const fb = (id: string, createdAt = new Date().toISOString()): Feedback => ({
  id,
  createdAt,
  senderId: 's',
  receiverId: 'r',
  eventId: 'e',
  content: id,
});

describe('applyMuralEvent', () => {
  it('insere novo kudo no topo quando é o mais recente', () => {
    const older = fb('1', '2026-05-07T10:00:00.000Z');
    const newer = fb('2', '2026-05-07T11:00:00.000Z');
    const result = applyMuralEvent([older], { type: 'kudo.created', feedback: newer });
    expect(result.map((f) => f.id)).toEqual(['2', '1']);
  });

  it('mantém ordem desc por createdAt mesmo quando evento chega fora de ordem', () => {
    const newer = fb('2', '2026-05-07T11:00:00.000Z');
    const older = fb('1', '2026-05-07T10:00:00.000Z');
    const result = applyMuralEvent([newer], { type: 'kudo.created', feedback: older });
    expect(result.map((f) => f.id)).toEqual(['2', '1']);
  });

  it('é idempotente para o mesmo id', () => {
    const initial = [fb('1')];
    const result = applyMuralEvent(initial, { type: 'kudo.created', feedback: fb('1') });
    expect(result).toBe(initial);
  });
});
