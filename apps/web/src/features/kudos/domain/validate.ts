import { kudoContentSchema } from '@fastkudos/shared';

export function validateKudoContent(input: string): { ok: true; value: string } | { ok: false; error: string } {
  const r = kudoContentSchema.safeParse(input);
  if (r.success) return { ok: true, value: r.data };
  return { ok: false, error: r.error.issues[0]?.message ?? 'inválido' };
}
