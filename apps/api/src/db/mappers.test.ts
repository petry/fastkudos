import { describe, expect, it } from 'vitest';
import type { events, feedbacks, profiles } from '../../drizzle/schema';
import { toEvent, toFeedback, toProfile } from './mappers';

describe('toFeedback', () => {
  it('converte row em Feedback de domínio com createdAt ISO', () => {
    const row: typeof feedbacks.$inferSelect = {
      id: '11111111-1111-1111-1111-111111111111',
      createdAt: new Date('2026-01-02T03:04:05.000Z'),
      senderId: '22222222-2222-2222-2222-222222222222',
      receiverId: '33333333-3333-3333-3333-333333333333',
      eventId: '44444444-4444-4444-4444-444444444444',
      content: 'oi',
    };
    expect(toFeedback(row)).toEqual({
      id: row.id,
      createdAt: '2026-01-02T03:04:05.000Z',
      senderId: row.senderId,
      receiverId: row.receiverId,
      eventId: row.eventId,
      content: 'oi',
    });
  });
});

describe('toEvent', () => {
  it('converte row em Event de domínio com createdAt ISO', () => {
    const row: typeof events.$inferSelect = {
      id: '11111111-1111-1111-1111-111111111111',
      createdAt: new Date('2026-01-02T03:04:05.000Z'),
      name: 'Festa',
      slug: 'festa',
      ownerId: '22222222-2222-2222-2222-222222222222',
    };
    expect(toEvent(row)).toEqual({
      id: row.id,
      createdAt: '2026-01-02T03:04:05.000Z',
      name: 'Festa',
      slug: 'festa',
      ownerId: row.ownerId,
    });
  });
});

describe('toProfile', () => {
  const baseRow: typeof profiles.$inferSelect = {
    id: '11111111-1111-1111-1111-111111111111',
    displayName: 'Ana',
    eventId: '22222222-2222-2222-2222-222222222222',
    userId: null,
    isAdmin: false,
    createdAt: new Date('2026-01-02T03:04:05.000Z'),
  };

  it('converte row em Profile sem avatar', () => {
    expect(toProfile(baseRow, null)).toEqual({
      id: baseRow.id,
      displayName: 'Ana',
      eventId: baseRow.eventId,
      isAdmin: false,
      avatarUrl: null,
    });
  });

  it('aceita avatarUrl quando vem do join com users', () => {
    expect(toProfile(baseRow, 'https://example.com/a.png')).toEqual({
      id: baseRow.id,
      displayName: 'Ana',
      eventId: baseRow.eventId,
      isAdmin: false,
      avatarUrl: 'https://example.com/a.png',
    });
  });

  it('preserva isAdmin=true', () => {
    expect(toProfile({ ...baseRow, isAdmin: true }, null).isAdmin).toBe(true);
  });
});
