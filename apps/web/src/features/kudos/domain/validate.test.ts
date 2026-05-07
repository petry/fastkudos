import { describe, expect, it } from 'vitest';
import { validateKudoContent } from './validate';

describe('validateKudoContent', () => {
  it('aceita conteúdo válido e faz trim', () => {
    const r = validateKudoContent('  oi  ');
    expect(r).toEqual({ ok: true, value: 'oi' });
  });

  it('rejeita vazio', () => {
    const r = validateKudoContent('   ');
    expect(r.ok).toBe(false);
  });
});
