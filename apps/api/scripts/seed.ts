import { Client } from 'pg';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL não definido');

const seedEmail = process.env.SEED_SUPERADMIN_EMAIL ?? 'demo@fastkudos.app';
const seedName = process.env.SEED_SUPERADMIN_NAME ?? 'Demo Superadmin';
// Em dev, criamos um superadmin com provider 'legacy'. Para usar de verdade, é
// preciso logar via Google com o mesmo email — o callback OAuth promove o
// registro (troca provider/sub) preservando o id e role.
const seedSub = process.env.SEED_SUPERADMIN_SUB ?? `seed-${seedEmail}`;

const client = new Client({ connectionString: url });
await client.connect();
try {
  await client.query('BEGIN');
  const user = await client.query<{ id: string }>(
    `INSERT INTO users(email, name, role, oauth_provider, oauth_sub)
     VALUES($1, $2, 'superadmin', 'legacy', $3)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [seedEmail, seedName, seedSub],
  );
  const userId = user.rows[0]!.id;
  const event = await client.query<{ id: string }>(
    `INSERT INTO events(name, slug, owner_id) VALUES('Demo Event', 'demo', $1) RETURNING id`,
    [userId],
  );
  const eventId = event.rows[0]!.id;
  await client.query(
    `INSERT INTO profiles(display_name, event_id) VALUES('Alice', $1), ('Bob', $1), ('Carol', $1)`,
    [eventId],
  );
  await client.query('COMMIT');
  console.log(`seed OK — superadmin: ${seedEmail} (provider 'legacy', faça login via Google com este email para promover)`);
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  await client.end();
}
