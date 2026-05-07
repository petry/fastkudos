import { Client } from 'pg';
import { hashPassword } from '../src/auth/password';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL não definido');

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'demo@fastkudos.app';
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'demo-fastkudos-2026';

const passwordHash = await hashPassword(adminPassword);

const client = new Client({ connectionString: url });
await client.connect();
try {
  await client.query('BEGIN');
  const admin = await client.query<{ id: string }>(
    `INSERT INTO admin_users(email, password_hash) VALUES($1, $2) RETURNING id`,
    [adminEmail, passwordHash],
  );
  const adminId = admin.rows[0]!.id;
  const event = await client.query<{ id: string }>(
    `INSERT INTO events(name, slug, owner_id) VALUES('Demo Event', 'demo', $1) RETURNING id`,
    [adminId],
  );
  const eventId = event.rows[0]!.id;
  await client.query(
    `INSERT INTO profiles(display_name, event_id) VALUES('Alice', $1), ('Bob', $1), ('Carol', $1)`,
    [eventId],
  );
  await client.query('COMMIT');
  console.log(`seed OK — admin: ${adminEmail} / senha: ${adminPassword}`);
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  await client.end();
}
