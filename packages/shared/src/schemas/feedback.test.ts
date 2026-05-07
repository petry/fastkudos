import { describe, expect, it } from 'vitest';
import { kudoContentSchema, KUDO_MAX_LENGTH } from './feedback';

describe('kudoContentSchema', () => {
  it('aceita mensagem com conteúdo válido', () => {
    expect(kudoContentSchema.parse('  obrigado!  ')).toBe('obrigado!');
  });

  it('rejeita mensagem vazia ou só espaços', () => {
    expect(kudoContentSchema.safeParse('   ').success).toBe(false);
    expect(kudoContentSchema.safeParse('').success).toBe(false);
  });

  it(`rejeita mensagem maior que ${KUDO_MAX_LENGTH} caracteres`, () => {
    expect(kudoContentSchema.safeParse('a'.repeat(KUDO_MAX_LENGTH + 1)).success).toBe(false);
  });
});
