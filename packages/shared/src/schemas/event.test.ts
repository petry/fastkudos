import { describe, expect, it } from 'vitest';
import { slugSchema } from './event';

describe('slugSchema', () => {
  it('aceita kebab-case válido', () => {
    expect(slugSchema.parse('offsite-tech-2026')).toBe('offsite-tech-2026');
  });

  it.each(['Has-Upper', 'has_underscore', 'has space', '-leading', 'trailing-', 'ab'])(
    'rejeita slug inválido: %s',
    (s) => {
      expect(slugSchema.safeParse(s).success).toBe(false);
    },
  );
});
