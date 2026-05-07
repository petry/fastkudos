export type OauthProviderName = 'google';

export interface OauthProfile {
  provider: OauthProviderName;
  sub: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export type UserRole = 'user' | 'superadmin';
export type StoredProvider = 'google' | 'legacy';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  oauthProvider: StoredProvider;
  oauthSub: string;
}
