import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Client } from 'pg';
import app from '../../src/index';

// Smoke de integração: levanta um Postgres efêmero, aplica schema mínimo e
// valida que o app responde. Próximas features encadearão repos Drizzle aqui.

let container: StartedPostgreSqlContainer | undefined;

beforeAll(async () => {
  if (process.env.SKIP_INTEGRATION) return;
  container = await new PostgreSqlContainer('postgres:16-alpine').start();
  const client = new Client({ connectionString: container.getConnectionUri() });
  await client.connect();
  await client.query('SELECT 1');
  await client.end();
}, 120_000);

afterAll(async () => {
  await container?.stop();
});

describe('integration smoke', () => {
  it.skipIf(process.env.SKIP_INTEGRATION)('Postgres ephemeral está acessível', () => {
    expect(container?.getConnectionUri()).toMatch(/^postgres:\/\//);
  });

  it('GET /health continua respondendo no contexto de integração', async () => {
    const res = await app.request('http://local/health');
    expect(res.status).toBe(200);
  });
});
