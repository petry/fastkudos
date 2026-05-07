import type { Context, MiddlewareHandler } from 'hono';
import { verifyJwt, type JwtClaims } from './jwt';
import type { Env } from '../index';

export interface AuthUser {
  profileId: string;
  eventId: string;
  displayName: string;
  isAdmin: boolean;
}

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
  return {
    profileId: c.sub,
    eventId: c.event_id,
    displayName: c.display_name,
    isAdmin: c.is_admin,
  };
}

export function getUser(c: Context<AuthContext>): AuthUser {
  const user = c.get('user');
  if (!user) throw new Error('rota sem requireAuth() tentou ler user');
  return user;
}

export function requireAdmin(): MiddlewareHandler<AuthContext> {
  return async (c, next) => {
    const user = c.get('user');
    if (!user || !user.isAdmin) return c.json({ error: 'forbidden' }, 403);
    await next();
  };
}
