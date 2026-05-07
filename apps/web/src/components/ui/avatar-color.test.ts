import { describe, expect, it } from 'vitest';
import { AVATAR_PALETTE, avatarColorFor, initialsFor } from './avatar-color';

describe('avatarColorFor', () => {
  it('retorna a mesma cor para o mesmo nome', () => {
    expect(avatarColorFor('Ana Silva')).toBe(avatarColorFor('Ana Silva'));
  });

  it('escolhe sempre uma cor da paleta', () => {
    const tones = new Set(AVATAR_PALETTE.map((p) => p.tone));
    for (const name of ['Ana', 'Bruno', 'Carla', 'Diego', 'Eva', 'Fábio', 'Gisele', 'Hugo']) {
      expect(tones.has(avatarColorFor(name).tone)).toBe(true);
    }
  });

  it('distribui em pelo menos 4 buckets diferentes para nomes variados', () => {
    const names = ['Ana', 'Bruno', 'Carla', 'Diego', 'Eva', 'Fábio', 'Gisele', 'Hugo', 'Iara', 'João'];
    const tones = new Set(names.map((n) => avatarColorFor(n).tone));
    expect(tones.size).toBeGreaterThanOrEqual(4);
  });

  it('lida com string vazia sem crash', () => {
    const got = avatarColorFor('');
    expect(AVATAR_PALETTE.some((p) => p.tone === got.tone)).toBe(true);
  });
});

describe('initialsFor', () => {
  it('extrai a primeira letra de cada palavra (até 2)', () => {
    expect(initialsFor('Ana Silva')).toBe('AS');
    expect(initialsFor('Maria Clara Souza')).toBe('MC');
  });

  it('usa só uma letra para nome único', () => {
    expect(initialsFor('Ana')).toBe('A');
  });

  it('lida com nome vazio', () => {
    expect(initialsFor('')).toBe('?');
  });

  it('ignora espaços extras', () => {
    expect(initialsFor('  Ana   Silva ')).toBe('AS');
  });
});
