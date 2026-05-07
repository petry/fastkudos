import type { Context, MiddlewareHandler } from 'hono';
import { verifyJwt, type JwtClaims, type UserRole } from './jwt';
import type { Env } from '../index';

export type AuthUser =
  | { kind: 'anon'; profileId: string; eventId: string; displayName: string }
  | { kind: 'user'; userId: string; role: UserRole; displayName: string };

export type AuthContext = { Variables: { user: AuthUser }; Bindings: Env };

export function requireAuth(): MiddlewareHandler<AuthContext> {
  return async (c, next) => {
    const header = c.req.header('authorization') ?? '';
    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (!match) return c.json({ error: 'unauthorized' }, 401);

    let claims: JwtClaims;
    try {
      claims = await verifyJwt(match[1]!, c.env.JWT_SECRET);
    } catch {
      return c.json({ error: 'unauthorized' }, 401);
    }
    c.set('user', claimsToUser(claims));
    await next();
  };
}

function claimsToUser(c: JwtClaims): AuthUser {
  if (c.kind === 'user') {
    return {
      kind: 'user',
      userId: c.sub,
      role: c.role ?? 'user',
      displayName: c.display_name,
    };
  }
  return {
    kind: 'anon',
    profileId: c.sub,
    eventId: c.event_id,
    displayName: c.display_name,
  };
}

export function getUser(c: Context<AuthContext>): AuthUser {
  const user = c.get('user');
  if (!user) throw new Error('rota sem requireAuth() tentou ler user');
  return user;
}

export function getAnonUser(c: Context<AuthContext>): Extract<AuthUser, { kind: 'anon' }> {
  const user = getUser(c);
  if (user.kind !== 'anon') throw new Error('rota anônima recebeu user logado');
  return user;
}

export function getLoggedUser(c: Context<AuthContext>): Extract<AuthUser, { kind: 'user' }> {
  const user = getUser(c);
  if (user.kind !== 'user') throw new Error('rota de user logado recebeu anon');
  return user;
}

export function requireAnon(): MiddlewareHandler<AuthContext> {
  return async (c, next) => {
    const user = c.get('user');
    if (!user || user.kind !== 'anon') return c.json({ error: 'forbidden' }, 403);
    await next();
  };
}

export function requireUser(): MiddlewareHandler<AuthContext> {
  return async (c, next) => {
    const user = c.get('user');
    if (!user || user.kind !== 'user') return c.json({ error: 'forbidden' }, 403);
    await next();
  };
}

export function requireSuperadmin(): MiddlewareHandler<AuthContext> {
  return async (c, next) => {
    const user = c.get('user');
    if (!user || user.kind !== 'user' || user.role !== 'superadmin') {
      return c.json({ error: 'forbidden' }, 403);
    }
    await next();
  };
}
