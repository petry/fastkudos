import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL não definido');

const dir = join(import.meta.dirname ?? new URL('.', import.meta.url).pathname, '..', 'drizzle', 'migrations');

const client = new Client({ connectionString: url });
await client.connect();
try {
  await client.query(`CREATE TABLE IF NOT EXISTS __migrations (name text primary key, applied_at timestamptz default now())`);
  const applied = new Set<string>(
    (await client.query<{ name: string }>('SELECT name FROM __migrations')).rows.map((r: { name: string }) => r.name),
  );
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) {
    if (applied.has(f)) continue;
    const sql = readFileSync(join(dir, f), 'utf8');
    console.log(`applying ${f}`);
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO __migrations(name) VALUES ($1)', [f]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    }
  }
  console.log('migrations OK');
} finally {
  await client.end();
}
