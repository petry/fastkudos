import type { Env } from '../index';
import { createDb, type Database } from './client';

/**
 * Resolve a Database. Em produção usa o driver Neon HTTP a partir de DATABASE_URL.
 * Em testes de integração, o caller injeta `DB_OVERRIDE` no env (qualquer Database
 * compatível, ex.: drizzle/node-postgres apontando para um container Postgres).
 */
export function getDb(env: Env): Database {
  if (env.DB_OVERRIDE) return env.DB_OVERRIDE;
  return createDb(env.DATABASE_URL);
}
