import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { anonAuthInput, eventJoinInput } from '@fastkudos/shared';
import { getDb } from '../db/factory';
import { signJwt } from '../auth/jwt';
import { requireAuth, requireUser, getLoggedUser, type AuthContext } from '../auth/middleware';
import { NotFoundError, registerAnonParticipant } from '../features/onboarding/application/register-anon';
import { registerUserParticipant } from '../features/onboarding/application/register-user-participant';
import { eventLookup, profileRepo } from '../features/onboarding/infra/repos';
import { loginWithOauth } from '../features/auth/application/login-with-oauth';
import {
  InvalidIdTokenError,
  UnverifiedEmailError,
  generateCodeVerifier,
  generateState,
  googleProvider,
} from '../features/auth/infra/google-provider';
import { userRepo } from '../features/auth/infra/repos';

const ANON_TTL_SECONDS = 60 * 60 * 24 * 30;
const USER_TTL_SECONDS = 60 * 60 * 12;
const OAUTH_COOKIE_TTL_SECONDS = 60 * 5;
const STATE_COOKIE = 'fk_oauth_state';
const VERIFIER_COOKIE = 'fk_oauth_verifier';
const REDIRECT_COOKIE = 'fk_oauth_redirect';

export const authRoutes = new Hono<AuthContext>();

authRoutes.post('/anon', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = anonAuthInput.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'invalid_input', issues: parsed.error.issues }, 400);
  }

  const db = getDb(c.env);
  const secret = c.env.JWT_SECRET;

  try {
    const result = await registerAnonParticipant(
      {
        events: eventLookup(db),
        profiles: profileRepo(db),
        tokens: {
          issueAnon: ({ profileId, eventId, displayName }) =>
            signJwt(
              { sub: profileId, kind: 'anon', event_id: eventId, display_name: displayName },
              secret,
              ANON_TTL_SECONDS,
            ),
        },
      },
      parsed.data,
    );
    return c.json(result, 201);
  } catch (e) {
    if (e instanceof NotFoundError) return c.json({ error: 'event_not_found' }, 404);
    throw e;
  }
});

authRoutes.post('/event-join', requireAuth(), requireUser(), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = eventJoinInput.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'invalid_input', issues: parsed.error.issues }, 400);
  }

  const u = getLoggedUser(c);
  const db = getDb(c.env);
  const secret = c.env.JWT_SECRET;

  try {
    const result = await registerUserParticipant(
      {
        events: eventLookup(db),
        profiles: profileRepo(db),
        users: userRepo(db),
        tokens: {
          issueAnon: ({ profileId, eventId, displayName }) =>
            signJwt(
              { sub: profileId, kind: 'anon', event_id: eventId, display_name: displayName },
              secret,
              ANON_TTL_SECONDS,
            ),
        },
      },
      { slug: parsed.data.slug, userId: u.userId },
    );
    return c.json(result, 201);
  } catch (e) {
    if (e instanceof NotFoundError) return c.json({ error: 'event_not_found' }, 404);
    throw e;
  }
});

function isSecureRedirect(uri: string): boolean {
  return uri.startsWith('https://');
}

function sanitizeRedirect(raw: string | undefined): string {
  if (!raw) return '/dashboard';
  // Apenas redirects relativos para a própria web app, evita open-redirect.
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/dashboard';
}

authRoutes.get('/google/start', async (c) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OAUTH_REDIRECT_URI } = c.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !OAUTH_REDIRECT_URI) {
    return c.json({ error: 'oauth_not_configured' }, 503);
  }
  const provider = googleProvider({
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: OAUTH_REDIRECT_URI,
  });
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = provider.authorizationURL(state, codeVerifier);

  const secure = isSecureRedirect(OAUTH_REDIRECT_URI);
  const cookieOpts = {
    httpOnly: true,
    secure,
    sameSite: 'Lax' as const,
    path: '/',
    maxAge: OAUTH_COOKIE_TTL_SECONDS,
  };
  setCookie(c, STATE_COOKIE, state, cookieOpts);
  setCookie(c, VERIFIER_COOKIE, codeVerifier, cookieOpts);
  setCookie(c, REDIRECT_COOKIE, sanitizeRedirect(c.req.query('redirect')), cookieOpts);

  return c.redirect(url.toString(), 302);
});

authRoutes.get('/google/callback', async (c) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OAUTH_REDIRECT_URI, WEB_BASE_URL } = c.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !OAUTH_REDIRECT_URI || !WEB_BASE_URL) {
    return c.json({ error: 'oauth_not_configured' }, 503);
  }

  const code = c.req.query('code');
  const stateParam = c.req.query('state');
  const cookieState = getCookie(c, STATE_COOKIE);
  const codeVerifier = getCookie(c, VERIFIER_COOKIE);
  const redirectPath = sanitizeRedirect(getCookie(c, REDIRECT_COOKIE));

  // Sempre limpa cookies efêmeros ao retornar.
  deleteCookie(c, STATE_COOKIE, { path: '/' });
  deleteCookie(c, VERIFIER_COOKIE, { path: '/' });
  deleteCookie(c, REDIRECT_COOKIE, { path: '/' });

  if (!code || !stateParam || !cookieState || !codeVerifier || stateParam !== cookieState) {
    return c.redirect(`${WEB_BASE_URL}/login?error=oauth_state`, 302);
  }

  const provider = googleProvider({
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: OAUTH_REDIRECT_URI,
  });

  try {
    const profile = await provider.exchangeCode(code, codeVerifier);
    const db = getDb(c.env);
    const user = await loginWithOauth({ users: userRepo(db) }, profile);
    const token = await signJwt(
      {
        sub: user.id,
        kind: 'user',
        role: user.role,
        event_id: '',
        display_name: user.name,
      },
      c.env.JWT_SECRET,
      USER_TTL_SECONDS,
    );
    const url = new URL(`${WEB_BASE_URL}/auth/callback`);
    url.hash = `token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(redirectPath)}`;
    return c.redirect(url.toString(), 302);
  } catch (e) {
    if (e instanceof UnverifiedEmailError) {
      return c.redirect(`${WEB_BASE_URL}/login?error=unverified_email`, 302);
    }
    if (e instanceof InvalidIdTokenError) {
      return c.redirect(`${WEB_BASE_URL}/login?error=invalid_id_token`, 302);
    }
    return c.redirect(`${WEB_BASE_URL}/login?error=oauth_failed`, 302);
  }
});

authRoutes.get('/me', requireAuth(), async (c) => {
  const user = getLoggedUser(c);
  const db = getDb(c.env);
  const record = await userRepo(db).findById(user.userId);
  if (!record) return c.json({ error: 'not_found' }, 404);
  return c.json({
    user: {
      id: record.id,
      email: record.email,
      name: record.name,
      avatarUrl: record.avatarUrl,
      role: record.role,
    },
  });
});
