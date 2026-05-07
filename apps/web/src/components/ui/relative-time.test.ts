import { describe, expect, it } from 'vitest';
import { formatRelativeTime } from './relative-time';

const NOW = new Date('2026-05-06T12:00:00Z');

describe('formatRelativeTime', () => {
  it('mostra "agora" quando a diferença é menor que 1 min', () => {
    expect(formatRelativeTime(new Date('2026-05-06T11:59:30Z'), NOW)).toBe('agora');
    expect(formatRelativeTime(NOW, NOW)).toBe('agora');
  });

  it('mostra "X min" para minutos', () => {
    expect(formatRelativeTime(new Date('2026-05-06T11:55:00Z'), NOW)).toBe('5 min');
    expect(formatRelativeTime(new Date('2026-05-06T11:01:00Z'), NOW)).toBe('59 min');
  });

  it('mostra "X h" para horas dentro do mesmo dia', () => {
    expect(formatRelativeTime(new Date('2026-05-06T10:00:00Z'), NOW)).toBe('2 h');
    expect(formatRelativeTime(new Date('2026-05-06T00:00:00Z'), NOW)).toBe('12 h');
  });

  it('mostra "ontem" quando a diferença é entre 24h e 48h', () => {
    expect(formatRelativeTime(new Date('2026-05-05T12:00:00Z'), NOW)).toBe('ontem');
    expect(formatRelativeTime(new Date('2026-05-04T13:00:00Z'), NOW)).toBe('ontem');
  });

  it('formata como dd/MM HH:mm para datas mais antigas', () => {
    const out = formatRelativeTime(new Date('2026-04-20T15:30:00Z'), NOW);
    expect(out).toMatch(/^\d{2}\/\d{2} \d{2}:\d{2}$/);
  });

  it('aceita strings ISO', () => {
    expect(formatRelativeTime('2026-05-06T11:55:00Z', NOW)).toBe('5 min');
  });
});
