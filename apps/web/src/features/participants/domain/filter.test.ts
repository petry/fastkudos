import { describe, expect, it } from 'vitest';
import type { Profile } from '@fastkudos/shared';
import { filterParticipants } from './filter';

const list: Profile[] = [
  { id: '1', displayName: 'Alice', eventId: 'e', isAdmin: false, avatarUrl: null },
  { id: '2', displayName: 'Bob', eventId: 'e', isAdmin: false, avatarUrl: null },
  { id: '3', displayName: 'Alex', eventId: 'e', isAdmin: false, avatarUrl: null },
];

describe('filterParticipants', () => {
  it('retorna lista completa quando query vazia', () => {
    expect(filterParticipants(list, '   ')).toHaveLength(3);
  });

  it('filtra case-insensitive por substring', () => {
    expect(filterParticipants(list, 'al').map((p) => p.id)).toEqual(['1', '3']);
  });

  it('retorna vazio quando nada bate', () => {
    expect(filterParticipants(list, 'zzz')).toEqual([]);
  });
});
