import type { OauthProviderName, UserRecord } from './oauth-profile';

export interface UserRepo {
  findById(id: string): Promise<UserRecord | null>;
  findByProviderSub(provider: OauthProviderName, sub: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  create(input: {
    email: string;
    name: string;
    avatarUrl: string | null;
    oauthProvider: OauthProviderName;
    oauthSub: string;
  }): Promise<UserRecord>;
  /** Atualiza identificadores OAuth + dados de perfil. Mantém role. */
  promoteLegacy(
    id: string,
    patch: {
      name: string;
      avatarUrl: string | null;
      oauthProvider: OauthProviderName;
      oauthSub: string;
    },
  ): Promise<UserRecord>;
  /** Atualiza nome/avatar quando user já existia neste provider. */
  refreshProfile(
    id: string,
    patch: { name: string; avatarUrl: string | null },
  ): Promise<UserRecord>;
  listAll(): Promise<UserRecord[]>;
  countSuperadmins(): Promise<number>;
  updateRole(id: string, role: 'user' | 'superadmin'): Promise<UserRecord>;
}
