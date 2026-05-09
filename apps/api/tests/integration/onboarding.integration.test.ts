import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { signJwt } from '../../src/auth/jwt';
import app from '../../src/index';
import { events, profiles, users } from '../../drizzle/schema';
import { startIntegration, type IntegrationCtx } from './setup';

let ctx: IntegrationCtx;
const SECRET = 'test-secret-test-secret-test-secret';

function envFor() {
  return {
    DATABASE_URL: 'unused',
    JWT_SECRET: SECRET,
    EVENT_CHANNEL: { idFromName: () => ({}), get: () => ({ fetch: async () => new Response() }) } as never,
    GOOGLE_CLIENT_ID: 'test-client',
    GOOGLE_CLIENT_SECRET: 'test-secret',
    OAUTH_REDIRECT_URI: 'http://local/auth/google/callback',
    WEB_BASE_URL: 'http://local-web',
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

async function seedOwner(
  email: string,
  role: 'user' | 'superadmin' = 'user',
  avatarUrl: string | null = null,
) {
  const [u] = await ctx.db
    .insert(users)
    .values({
      email,
      name: email,
      avatarUrl,
      role,
      oauthProvider: 'google',
      oauthSub: `sub-${email}`,
    })
    .returning();
  return u!;
}

async function seedEvent(slug: string) {
  const owner = await seedOwner(`${slug}@x.com`);
  const [event] = await ctx.db
    .insert(events)
    .values({ name: slug, slug, ownerId: owner.id })
    .returning();
  return { owner, event: event! };
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
      { sub: pa!.id, kind: 'anon', event_id: a.event.id, display_name: 'Alice' },
      SECRET,
      60,
    );

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
      { sub: sender!.id, kind: 'anon', event_id: a.event.id, display_name: 'Sender' },
      SECRET,
      60,
    );
    const receiverToken = await signJwt(
      { sub: receiver!.id, kind: 'anon', event_id: a.event.id, display_name: 'Receiver' },
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

  it('GET /mural retorna apenas feedbacks do evento do caller (cross-event leak bloqueado)', async () => {
    const a = await seedEvent('event-a');
    const b = await seedEvent('event-b');
    const [pa1] = await ctx.db
      .insert(profiles)
      .values({ displayName: 'A1', eventId: a.event.id })
      .returning();
    const [pa2] = await ctx.db
      .insert(profiles)
      .values({ displayName: 'A2', eventId: a.event.id })
      .returning();
    const [pb1] = await ctx.db
      .insert(profiles)
      .values({ displayName: 'B1', eventId: b.event.id })
      .returning();
    const [pb2] = await ctx.db
      .insert(profiles)
      .values({ displayName: 'B2', eventId: b.event.id })
      .returning();
    const { feedbacks } = await import('../../drizzle/schema');
    await ctx.db.insert(feedbacks).values([
      { senderId: pa1!.id, receiverId: pa2!.id, eventId: a.event.id, content: 'kudo-a' },
      { senderId: pb1!.id, receiverId: pb2!.id, eventId: b.event.id, content: 'kudo-b' },
    ]);

    const tokenA = await signJwt(
      { sub: pa1!.id, kind: 'anon', event_id: a.event.id, display_name: 'A1' },
      SECRET,
      60,
    );

    const res = await app.request(
      'http://local/mural',
      { headers: { authorization: `Bearer ${tokenA}` } },
      envFor(),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { feedbacks: Array<{ content: string }> };
    expect(body.feedbacks.map((f) => f.content)).toEqual(['kudo-a']);
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
      { sub: sender!.id, kind: 'anon', event_id: a.event.id, display_name: 'S' },
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

describe('integração: auto-registro de user logado (event-join)', () => {
  async function userToken(userId: string, name: string) {
    return signJwt(
      { sub: userId, kind: 'user', role: 'user', event_id: '', display_name: name },
      SECRET,
      60,
    );
  }

  it('cria profile com user_id na primeira chamada e é idempotente na segunda', async () => {
    const e = await seedEvent('event-join-demo');
    // O dono do evento (criado por seedEvent) também participa.
    const token = await userToken(e.owner.id, e.owner.name);

    const first = await app.request(
      'http://local/auth/event-join',
      {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ slug: 'event-join-demo' }),
      },
      envFor(),
    );
    expect(first.status).toBe(201);
    const firstBody = (await first.json()) as { token: string; profile: { id: string; eventId: string } };
    expect(firstBody.profile.eventId).toBe(e.event.id);

    const rows = await ctx.db.select().from(profiles).where(eq(profiles.eventId, e.event.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]!.userId).toBe(e.owner.id);

    // Segunda chamada → mesmo profile.id, sem criar duplicata.
    const second = await app.request(
      'http://local/auth/event-join',
      {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ slug: 'event-join-demo' }),
      },
      envFor(),
    );
    expect(second.status).toBe(201);
    const secondBody = (await second.json()) as { profile: { id: string } };
    expect(secondBody.profile.id).toBe(firstBody.profile.id);

    const rowsAfter = await ctx.db.select().from(profiles).where(eq(profiles.eventId, e.event.id));
    expect(rowsAfter).toHaveLength(1);
  });

  it('expõe users.avatar_url no profile retornado e na listagem; anônimo fica com avatarUrl=null', async () => {
    const e = await seedEvent('event-join-avatar');
    // Owner com avatar do Google.
    await ctx.db
      .update(users)
      .set({ avatarUrl: 'https://lh.googleusercontent.com/owner.png' })
      .where(eq(users.id, e.owner.id));

    const ownerJwt = await userToken(e.owner.id, e.owner.name);
    const join = await app.request(
      'http://local/auth/event-join',
      {
        method: 'POST',
        headers: { authorization: `Bearer ${ownerJwt}`, 'content-type': 'application/json' },
        body: JSON.stringify({ slug: 'event-join-avatar' }),
      },
      envFor(),
    );
    expect(join.status).toBe(201);
    const joinBody = (await join.json()) as {
      token: string;
      profile: { id: string; avatarUrl: string | null };
    };
    expect(joinBody.profile.avatarUrl).toBe('https://lh.googleusercontent.com/owner.png');

    // Participante anônimo no mesmo evento — sem userId, avatar deve ser null.
    const anon = await app.request(
      'http://local/auth/anon',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: 'event-join-avatar', displayName: 'Anônima' }),
      },
      envFor(),
    );
    expect(anon.status).toBe(201);
    const anonBody = (await anon.json()) as { profile: { avatarUrl: string | null } };
    expect(anonBody.profile.avatarUrl).toBeNull();

    // GET /events/:slug/profiles deve trazer o avatar do owner e null pra anônima.
    const list = await app.request(
      `http://local/events/event-join-avatar/profiles`,
      { headers: { authorization: `Bearer ${joinBody.token}` } },
      envFor(),
    );
    expect(list.status).toBe(200);
    const listBody = (await list.json()) as {
      profiles: Array<{ displayName: string; avatarUrl: string | null }>;
    };
    const byName = new Map(listBody.profiles.map((p) => [p.displayName, p.avatarUrl]));
    expect(byName.get(e.owner.name)).toBe('https://lh.googleusercontent.com/owner.png');
    expect(byName.get('Anônima')).toBeNull();
  });

  it('retorna 404 quando o slug não existe', async () => {
    const stranger = await seedOwner('stranger@x.com');
    const token = await userToken(stranger.id, stranger.name);
    const res = await app.request(
      'http://local/auth/event-join',
      {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ slug: 'inexistente' }),
      },
      envFor(),
    );
    expect(res.status).toBe(404);
  });

  it('rejeita anônimo (kind=anon) com 403', async () => {
    const e = await seedEvent('anon-not-allowed');
    const anonToken = await signJwt(
      { sub: 'fake-profile', kind: 'anon', event_id: e.event.id, display_name: 'X' },
      SECRET,
      60,
    );
    const res = await app.request(
      'http://local/auth/event-join',
      {
        method: 'POST',
        headers: { authorization: `Bearer ${anonToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ slug: 'anon-not-allowed' }),
      },
      envFor(),
    );
    expect(res.status).toBe(403);
  });

  it('JWT retornado tem kind=anon e funciona em POST /kudos', async () => {
    const e = await seedEvent('event-join-kudos');
    const token = await userToken(e.owner.id, e.owner.name);

    const join = await app.request(
      'http://local/auth/event-join',
      {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ slug: 'event-join-kudos' }),
      },
      envFor(),
    );
    const joinBody = (await join.json()) as { token: string; profile: { id: string } };

    // Outro participante anônimo no mesmo evento, para servir de receiver.
    const [other] = await ctx.db
      .insert(profiles)
      .values({ displayName: 'Outro', eventId: e.event.id })
      .returning();

    const sent = await app.request(
      'http://local/kudos',
      {
        method: 'POST',
        headers: { authorization: `Bearer ${joinBody.token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ receiverId: other!.id, content: 'oi pessoal' }),
      },
      envFor(),
    );
    expect(sent.status).toBe(201);
  });
});

describe('integração: gerenciamento de eventos', () => {
  async function tokenFor(userId: string, name: string, role: 'user' | 'superadmin' = 'user') {
    return signJwt(
      { sub: userId, kind: 'user', role, event_id: '', display_name: name },
      SECRET,
      60,
    );
  }

  it('POST /me/events cria evento; outro user não pode apagar feedback alheio', async () => {
    const owner = await seedOwner('owner@x.com');
    const ownerToken = await tokenFor(owner.id, 'owner@x.com');

    const create = await app.request(
      'http://local/me/events',
      {
        method: 'POST',
        headers: { authorization: `Bearer ${ownerToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Demo', slug: 'demo' }),
      },
      envFor(),
    );
    expect(create.status).toBe(201);

    const otherUser = await seedOwner('other@x.com');
    const otherToken = await tokenFor(otherUser.id, 'other@x.com');

    const eventsRows = await ctx.db.select().from(events);
    const eventId = eventsRows[0]!.id;
    const [p1] = await ctx.db.insert(profiles).values({ displayName: 'A', eventId }).returning();
    const [p2] = await ctx.db.insert(profiles).values({ displayName: 'B', eventId }).returning();
    const { feedbacks } = await import('../../drizzle/schema');
    const [fb] = await ctx.db
      .insert(feedbacks)
      .values({ senderId: p1!.id, receiverId: p2!.id, eventId, content: 'top' })
      .returning();

    const forbidden = await app.request(
      `http://local/me/feedbacks/${fb!.id}`,
      { method: 'DELETE', headers: { authorization: `Bearer ${otherToken}` } },
      envFor(),
    );
    expect(forbidden.status).toBe(403);

    const ok = await app.request(
      `http://local/me/feedbacks/${fb!.id}`,
      { method: 'DELETE', headers: { authorization: `Bearer ${ownerToken}` } },
      envFor(),
    );
    expect(ok.status).toBe(204);

    const remaining = await ctx.db.select().from(feedbacks);
    expect(remaining).toHaveLength(0);
  });

  it('superadmin apaga feedback de evento alheio (bypass de owner)', async () => {
    const owner = await seedOwner('owner@x.com');
    const root = await seedOwner('root@x.com', 'superadmin');
    const rootToken = await tokenFor(root.id, 'root@x.com', 'superadmin');

    const [ev] = await ctx.db
      .insert(events)
      .values({ name: 'Demo', slug: 'demo-su', ownerId: owner.id })
      .returning();
    const [p1] = await ctx.db.insert(profiles).values({ displayName: 'A', eventId: ev!.id }).returning();
    const [p2] = await ctx.db.insert(profiles).values({ displayName: 'B', eventId: ev!.id }).returning();
    const { feedbacks } = await import('../../drizzle/schema');
    const [fb] = await ctx.db
      .insert(feedbacks)
      .values({ senderId: p1!.id, receiverId: p2!.id, eventId: ev!.id, content: 'mod' })
      .returning();

    const ok = await app.request(
      `http://local/me/feedbacks/${fb!.id}`,
      { method: 'DELETE', headers: { authorization: `Bearer ${rootToken}` } },
      envFor(),
    );
    expect(ok.status).toBe(204);
  });

  it('PATCH /me/events/:id atualiza nome/slug do dono e nega para outro user', async () => {
    const owner = await seedOwner('a1@x.com');
    const [ev] = await ctx.db
      .insert(events)
      .values({ name: 'Antigo', slug: 'antigo', ownerId: owner.id })
      .returning();
    const ownerToken = await tokenFor(owner.id, 'a1@x.com');

    const ok = await app.request(
      `http://local/me/events/${ev!.id}`,
      {
        method: 'PATCH',
        headers: { authorization: `Bearer ${ownerToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Novo', slug: 'novo' }),
      },
      envFor(),
    );
    expect(ok.status).toBe(200);
    const body = (await ok.json()) as { event: { name: string; slug: string } };
    expect(body.event).toMatchObject({ name: 'Novo', slug: 'novo' });

    const stranger = await seedOwner('a2@x.com');
    const strangerToken = await tokenFor(stranger.id, 'a2@x.com');
    const forbidden = await app.request(
      `http://local/me/events/${ev!.id}`,
      {
        method: 'PATCH',
        headers: { authorization: `Bearer ${strangerToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Hack' }),
      },
      envFor(),
    );
    expect(forbidden.status).toBe(403);
  });

  it('DELETE /me/events/:id apaga em cascata; nega para outro user', async () => {
    const { feedbacks } = await import('../../drizzle/schema');

    const owner = await seedOwner('owner-del@x.com');
    const [ev] = await ctx.db
      .insert(events)
      .values({ name: 'Demo', slug: 'demo-del', ownerId: owner.id })
      .returning();
    const [p1] = await ctx.db.insert(profiles).values({ displayName: 'A', eventId: ev!.id }).returning();
    const [p2] = await ctx.db.insert(profiles).values({ displayName: 'B', eventId: ev!.id }).returning();
    await ctx.db
      .insert(feedbacks)
      .values({ senderId: p1!.id, receiverId: p2!.id, eventId: ev!.id, content: 'top' });

    const ownerToken = await tokenFor(owner.id, 'owner-del@x.com');

    const stranger = await seedOwner('outro@x.com');
    const strangerToken = await tokenFor(stranger.id, 'outro@x.com');
    const forbidden = await app.request(
      `http://local/me/events/${ev!.id}`,
      { method: 'DELETE', headers: { authorization: `Bearer ${strangerToken}` } },
      envFor(),
    );
    expect(forbidden.status).toBe(403);

    const ok = await app.request(
      `http://local/me/events/${ev!.id}`,
      { method: 'DELETE', headers: { authorization: `Bearer ${ownerToken}` } },
      envFor(),
    );
    expect(ok.status).toBe(204);

    const remainingEvents = await ctx.db.select().from(events).where(eq(events.id, ev!.id));
    expect(remainingEvents).toHaveLength(0);
    const remainingProfiles = await ctx.db
      .select()
      .from(profiles)
      .where(eq(profiles.eventId, ev!.id));
    expect(remainingProfiles).toHaveLength(0);
    const remainingFeedbacks = await ctx.db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.eventId, ev!.id));
    expect(remainingFeedbacks).toHaveLength(0);
  });
});

describe('integração: superadmin', () => {
  async function tokenFor(userId: string, name: string, role: 'user' | 'superadmin') {
    return signJwt(
      { sub: userId, kind: 'user', role, event_id: '', display_name: name },
      SECRET,
      60,
    );
  }

  it('GET /superadmin/events lista todos eventos', async () => {
    const root = await seedOwner('root@x.com', 'superadmin');
    const owner = await seedOwner('owner@x.com');
    await ctx.db.insert(events).values([
      { name: 'A', slug: 'a-sa', ownerId: owner.id },
      { name: 'B', slug: 'b-sa', ownerId: root.id },
    ]);
    const rootToken = await tokenFor(root.id, 'root@x.com', 'superadmin');

    const res = await app.request(
      'http://local/superadmin/events',
      { headers: { authorization: `Bearer ${rootToken}` } },
      envFor(),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { events: Array<{ slug: string }> };
    expect(body.events.map((e) => e.slug).sort()).toEqual(['a-sa', 'b-sa']);
  });

  it('user comum recebe 403 em rotas /superadmin', async () => {
    const u = await seedOwner('u@x.com');
    const t = await tokenFor(u.id, 'u@x.com', 'user');
    const res = await app.request(
      'http://local/superadmin/events',
      { headers: { authorization: `Bearer ${t}` } },
      envFor(),
    );
    expect(res.status).toBe(403);
  });

  it('PATCH /superadmin/users/:id promove user e bloqueia rebaixar último superadmin', async () => {
    const root = await seedOwner('root@x.com', 'superadmin');
    const target = await seedOwner('target@x.com');
    const rootToken = await tokenFor(root.id, 'root@x.com', 'superadmin');

    const promote = await app.request(
      `http://local/superadmin/users/${target.id}`,
      {
        method: 'PATCH',
        headers: { authorization: `Bearer ${rootToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ role: 'superadmin' }),
      },
      envFor(),
    );
    expect(promote.status).toBe(200);

    // Agora rebaixa o target — restou um superadmin (root).
    const demoteOk = await app.request(
      `http://local/superadmin/users/${target.id}`,
      {
        method: 'PATCH',
        headers: { authorization: `Bearer ${rootToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ role: 'user' }),
      },
      envFor(),
    );
    expect(demoteOk.status).toBe(200);

    // Tentar rebaixar root (último superadmin) → 409.
    const lastFail = await app.request(
      `http://local/superadmin/users/${root.id}`,
      {
        method: 'PATCH',
        headers: { authorization: `Bearer ${rootToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ role: 'user' }),
      },
      envFor(),
    );
    expect(lastFail.status).toBe(409);
  });
});

describe('integração: migração legacy', () => {
  it('login OAuth promove user com oauth_provider=legacy preservando id e role superadmin', async () => {
    // Seed simulando o estado pós-migração: admin antigo virou user com provider='legacy'.
    const [legacy] = await ctx.db
      .insert(users)
      .values({
        email: 'old-admin@x.com',
        name: 'old-admin@x.com',
        role: 'superadmin',
        oauthProvider: 'legacy',
        oauthSub: 'legacy-old-admin',
      })
      .returning();
    const [ev] = await ctx.db
      .insert(events)
      .values({ name: 'Antigo', slug: 'antigo-evento', ownerId: legacy!.id })
      .returning();

    // Importa o use case e verifica que ao "logar" com Google promove o registro.
    const { loginWithOauth } = await import('../../src/features/auth/application/login-with-oauth');
    const { userRepo } = await import('../../src/features/auth/infra/repos');

    const promoted = await loginWithOauth(
      { users: userRepo(ctx.db) },
      {
        provider: 'google',
        sub: 'google-real-sub',
        email: 'old-admin@x.com',
        name: 'Old Admin',
        avatarUrl: 'https://avatar/o.png',
      },
    );
    expect(promoted.id).toBe(legacy!.id);
    expect(promoted.role).toBe('superadmin');
    expect(promoted.oauthProvider).toBe('google');
    expect(promoted.oauthSub).toBe('google-real-sub');

    // events.owner_id continua válido após promoção (o id não mudou).
    const stillThere = await ctx.db.select().from(events).where(eq(events.id, ev!.id));
    expect(stillThere).toHaveLength(1);
    expect(stillThere[0]!.ownerId).toBe(legacy!.id);
  });
});
