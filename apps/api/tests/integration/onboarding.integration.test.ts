import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { hashPassword } from '../../src/auth/password';
import { signJwt } from '../../src/auth/jwt';
import app from '../../src/index';
import { adminUsers, events, profiles } from '../../drizzle/schema';
import { startIntegration, type IntegrationCtx } from './setup';

let ctx: IntegrationCtx;
const SECRET = 'test-secret-test-secret-test-secret';

function envFor() {
  return {
    DATABASE_URL: 'unused',
    JWT_SECRET: SECRET,
    EVENT_CHANNEL: { idFromName: () => ({}), get: () => ({ fetch: async () => new Response() }) } as never,
    DB_OVERRIDE: ctx.db,
  };
}

beforeAll(async () => {
  ctx = await startIntegration();
}, 180_000);

afterAll(async () => {
  await ctx?.stop();
});

beforeEach(async () => {
  await ctx.reset();
});

async function seedEvent(slug: string) {
  const [admin] = await ctx.db
    .insert(adminUsers)
    .values({ email: `${slug}@x.com`, passwordHash: await hashPassword('senha-segura') })
    .returning();
  const [event] = await ctx.db
    .insert(events)
    .values({ name: slug, slug, ownerId: admin!.id })
    .returning();
  return { admin: admin!, event: event! };
}

describe('integração: onboarding + listagem + autorização', () => {
  it('POST /auth/anon cria profile e retorna JWT válido', async () => {
    await seedEvent('demo');
    const res = await app.request(
      'http://local/auth/anon',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: 'demo', displayName: 'Alice' }),
      },
      envFor(),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { token: string; profile: { id: string; eventId: string } };
    expect(body.profile.eventId).toBeDefined();

    const rows = await ctx.db.select().from(profiles);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.displayName).toBe('Alice');
  });

  it('POST /auth/anon retorna 404 quando slug não existe', async () => {
    const res = await app.request(
      'http://local/auth/anon',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: 'nope', displayName: 'X' }),
      },
      envFor(),
    );
    expect(res.status).toBe(404);
  });

  it('GET /events/:slug/profiles isola por evento (cross-event leak bloqueado)', async () => {
    const a = await seedEvent('event-a');
    const b = await seedEvent('event-b');
    const [pa] = await ctx.db
      .insert(profiles)
      .values({ displayName: 'Alice', eventId: a.event.id })
      .returning();
    await ctx.db.insert(profiles).values({ displayName: 'Bob', eventId: b.event.id });

    const tokenA = await signJwt(
      { sub: pa!.id, event_id: a.event.id, display_name: 'Alice', is_admin: false },
      SECRET,
      60,
    );

    // caller pertence ao evento A → consegue listar A
    const ok = await app.request(
      `http://local/events/event-a/profiles`,
      { headers: { authorization: `Bearer ${tokenA}` } },
      envFor(),
    );
    expect(ok.status).toBe(200);
    const okBody = (await ok.json()) as {
      event: { id: string; name: string; slug: string };
      profiles: Array<{ displayName: string }>;
    };
    expect(okBody.event).toEqual({ id: a.event.id, name: 'event-a', slug: 'event-a' });
    expect(okBody.profiles.map((p) => p.displayName)).toEqual(['Alice']);

    // caller pertence a A mas tenta listar B → 403
    const forbidden = await app.request(
      `http://local/events/event-b/profiles`,
      { headers: { authorization: `Bearer ${tokenA}` } },
      envFor(),
    );
    expect(forbidden.status).toBe(403);
  });

  it('POST /kudos persiste feedback e GET /inbox retorna para receiver', async () => {
    const a = await seedEvent('event-a');
    const [sender] = await ctx.db
      .insert(profiles)
      .values({ displayName: 'Sender', eventId: a.event.id })
      .returning();
    const [receiver] = await ctx.db
      .insert(profiles)
      .values({ displayName: 'Receiver', eventId: a.event.id })
      .returning();

    const senderToken = await signJwt(
      { sub: sender!.id, event_id: a.event.id, display_name: 'Sender', is_admin: false },
      SECRET,
      60,
    );
    const receiverToken = await signJwt(
      { sub: receiver!.id, event_id: a.event.id, display_name: 'Receiver', is_admin: false },
      SECRET,
      60,
    );

    const submitted = await app.request(
      'http://local/kudos',
      {
        method: 'POST',
        headers: { authorization: `Bearer ${senderToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ receiverId: receiver!.id, content: 'mandou bem!' }),
      },
      envFor(),
    );
    expect(submitted.status).toBe(201);

    const inbox = await app.request(
      'http://local/inbox',
      { headers: { authorization: `Bearer ${receiverToken}` } },
      envFor(),
    );
    expect(inbox.status).toBe(200);
    const inboxBody = (await inbox.json()) as { feedbacks: Array<{ content: string }> };
    expect(inboxBody.feedbacks.map((f) => f.content)).toEqual(['mandou bem!']);
  });

  it('POST /kudos rejeita destinatário de outro evento (cross-event)', async () => {
    const a = await seedEvent('event-a');
    const b = await seedEvent('event-b');
    const [sender] = await ctx.db
      .insert(profiles)
      .values({ displayName: 'Sender', eventId: a.event.id })
      .returning();
    const [other] = await ctx.db
      .insert(profiles)
      .values({ displayName: 'Other', eventId: b.event.id })
      .returning();

    const token = await signJwt(
      { sub: sender!.id, event_id: a.event.id, display_name: 'S', is_admin: false },
      SECRET,
      60,
    );
    const res = await app.request(
      'http://local/kudos',
      {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ receiverId: other!.id, content: 'oi' }),
      },
      envFor(),
    );
    expect(res.status).toBe(403);
  });
});

describe('integração: admin', () => {
  it('POST /auth/login emite JWT admin e POST /admin/events cria evento; admin de outro owner não pode apagar', async () => {
    // admin 1
    const hash = await hashPassword('s3nh@-segura');
    const [adm] = await ctx.db
      .insert(adminUsers)
      .values({ email: 'admin@x.com', passwordHash: hash })
      .returning();

    const login = await app.request(
      'http://local/auth/login',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'admin@x.com', password: 's3nh@-segura' }),
      },
      envFor(),
    );
    expect(login.status).toBe(200);
    const { token: adminToken } = (await login.json()) as { token: string };

    const create = await app.request(
      'http://local/admin/events',
      {
        method: 'POST',
        headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Demo', slug: 'demo' }),
      },
      envFor(),
    );
    expect(create.status).toBe(201);

    // outro admin tenta apagar feedback do evento do primeiro
    const [admin2] = await ctx.db
      .insert(adminUsers)
      .values({ email: 'other@x.com', passwordHash: await hashPassword('outra-senha') })
      .returning();
    const otherAdminToken = await signJwt(
      { sub: admin2!.id, event_id: '', display_name: 'other@x.com', is_admin: true },
      SECRET,
      60,
    );

    // cria um feedback no evento do admin 1
    const events = (await ctx.db.select().from((await import('../../drizzle/schema')).events));
    const eventId = events[0]!.id;
    const [p1] = await ctx.db.insert(profiles).values({ displayName: 'A', eventId }).returning();
    const [p2] = await ctx.db.insert(profiles).values({ displayName: 'B', eventId }).returning();
    const { feedbacks } = await import('../../drizzle/schema');
    const [fb] = await ctx.db
      .insert(feedbacks)
      .values({ senderId: p1!.id, receiverId: p2!.id, eventId, content: 'top' })
      .returning();

    const forbidden = await app.request(
      `http://local/admin/feedbacks/${fb!.id}`,
      { method: 'DELETE', headers: { authorization: `Bearer ${otherAdminToken}` } },
      envFor(),
    );
    expect(forbidden.status).toBe(403);

    const ok = await app.request(
      `http://local/admin/feedbacks/${fb!.id}`,
      { method: 'DELETE', headers: { authorization: `Bearer ${adminToken}` } },
      envFor(),
    );
    expect(ok.status).toBe(204);

    const remaining = await ctx.db.select().from(feedbacks);
    expect(remaining).toHaveLength(0);
  });
});
