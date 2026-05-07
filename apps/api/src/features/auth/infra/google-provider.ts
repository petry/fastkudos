import { Google, decodeIdToken, generateCodeVerifier, generateState } from 'arctic';
import type { OauthProfile } from '../domain/oauth-profile';

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

const SCOPES = ['openid', 'email', 'profile'];

interface GoogleIdTokenClaims {
  sub?: unknown;
  email?: unknown;
  email_verified?: unknown;
  name?: unknown;
  picture?: unknown;
}

export class UnverifiedEmailError extends Error {}
export class InvalidIdTokenError extends Error {}

export interface GoogleProvider {
  authorizationURL(state: string, codeVerifier: string): URL;
  exchangeCode(code: string, codeVerifier: string): Promise<OauthProfile>;
}

export function googleProvider(config: GoogleConfig): GoogleProvider {
  const client = new Google(config.clientId, config.clientSecret, config.redirectUri);
  return {
    authorizationURL(state, codeVerifier) {
      return client.createAuthorizationURL(state, codeVerifier, SCOPES);
    },
    async exchangeCode(code, codeVerifier) {
      const tokens = await client.validateAuthorizationCode(code, codeVerifier);
      const claims = decodeIdToken(tokens.idToken()) as GoogleIdTokenClaims;
      if (typeof claims.sub !== 'string' || typeof claims.email !== 'string') {
        throw new InvalidIdTokenError('id_token sem sub/email');
      }
      if (claims.email_verified !== true) {
        throw new UnverifiedEmailError('email não verificado pelo Google');
      }
      return {
        provider: 'google',
        sub: claims.sub,
        email: claims.email.toLowerCase(),
        name: typeof claims.name === 'string' && claims.name.length > 0 ? claims.name : claims.email,
        avatarUrl: typeof claims.picture === 'string' ? claims.picture : null,
      };
    },
  };
}

export { generateState, generateCodeVerifier };
