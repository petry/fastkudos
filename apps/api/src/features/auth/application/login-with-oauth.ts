import type { OauthProfile, UserRecord } from '../domain/oauth-profile';
import type { UserRepo } from '../domain/ports';

export interface LoginWithOauthDeps {
  users: UserRepo;
}

/**
 * Resolve a OauthProfile vinda do provedor para um UserRecord persistido.
 *
 * Estratégia (em ordem):
 * 1. Match por (provider, sub) — usuário recorrente: atualiza nome/avatar.
 * 2. Match por email com `oauth_provider='legacy'` — promove conta importada
 *    do antigo `admin_users` (preserva id e role 'superadmin', troca provider).
 * 3. Senão cria user novo (role 'user' default).
 *
 * Não fazemos match por email para outros providers — isso evitaria takeover
 * em caso de colisão de email entre Google e (futuramente) GitHub/LinkedIn.
 */
export async function loginWithOauth(
  deps: LoginWithOauthDeps,
  profile: OauthProfile,
): Promise<UserRecord> {
  const existing = await deps.users.findByProviderSub(profile.provider, profile.sub);
  if (existing) {
    if (existing.name !== profile.name || existing.avatarUrl !== profile.avatarUrl) {
      return deps.users.refreshProfile(existing.id, {
        name: profile.name,
        avatarUrl: profile.avatarUrl,
      });
    }
    return existing;
  }

  const legacy = await deps.users.findByEmail(profile.email);
  if (legacy && legacy.oauthProvider === 'legacy') {
    return deps.users.promoteLegacy(legacy.id, {
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      oauthProvider: profile.provider,
      oauthSub: profile.sub,
    });
  }

  return deps.users.create({
    email: profile.email,
    name: profile.name,
    avatarUrl: profile.avatarUrl,
    oauthProvider: profile.provider,
    oauthSub: profile.sub,
  });
}
