import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword, WORKERS_PBKDF2_MAX_ITERATIONS } from './password';

describe('password', () => {
  it('faz round-trip com senha correta', async () => {
    const stored = await hashPassword('correct horse battery staple');
    expect(await verifyPassword('correct horse battery staple', stored)).toBe(true);
  });

  it('rejeita senha incorreta', async () => {
    const stored = await hashPassword('s3nh@-real');
    expect(await verifyPassword('outra', stored)).toBe(false);
  });

  it('hashes diferentes para a mesma senha (salt aleatório)', async () => {
    const a = await hashPassword('abc');
    const b = await hashPassword('abc');
    expect(a).not.toBe(b);
    expect(await verifyPassword('abc', a)).toBe(true);
    expect(await verifyPassword('abc', b)).toBe(true);
  });

  it('rejeita formato inválido', async () => {
    expect(await verifyPassword('x', 'lixo')).toBe(false);
  });

  // Regressão: Cloudflare Workers lançam NotSupportedError em PBKDF2 com mais de
  // 100k iterações, derrubando /auth/login com 500. Se alguém aumentar o
  // contador sem perceber, este teste falha antes do deploy.
  it('hash gerado fica dentro do limite de iterações do Workers', async () => {
    expect(WORKERS_PBKDF2_MAX_ITERATIONS).toBeLessThanOrEqual(100_000);
    const stored = await hashPassword('qualquer');
    const iterations = Number(stored.split('$')[1]);
    expect(iterations).toBeLessThanOrEqual(100_000);
  });
});
