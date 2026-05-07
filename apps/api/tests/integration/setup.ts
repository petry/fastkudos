import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../../drizzle/schema';
import type { Database } from '../../src/db/client';

export interface IntegrationCtx {
  container: StartedPostgreSqlContainer;
  pool: Pool;
  db: Database;
  reset: () => Promise<void>;
  stop: () => Promise<void>;
}

const MIGRATIONS_DIR = join(import.meta.dirname ?? new URL('.', import.meta.url).pathname, '..', '..', 'drizzle', 'migrations');

export async function startIntegration(): Promise<IntegrationCtx> {
  const container = await new PostgreSqlContainer('postgres:16-alpine').start();
  const pool = new Pool({ connectionString: container.getConnectionUri() });

  // Drizzle gera arquivos com `--> statement-breakpoint`. Aplicar como um único bloco
  // após remover os marcadores funciona para o schema atual (sem DDL transacional sensível).
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, f), 'utf8').replace(/-->.*$/gm, '');
    await pool.query(sql);
  }

  const db = drizzle(pool, { schema }) as unknown as Database;

  return {
    container,
    pool,
    db,
    async reset() {
      await pool.query('TRUNCATE feedbacks, profiles, events, admin_users RESTART IDENTITY CASCADE');
    },
    async stop() {
      await pool.end();
      await container.stop();
    },
  };
}
