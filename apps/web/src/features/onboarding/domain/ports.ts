import type { Profile } from '@fastkudos/shared';

export interface AuthGateway {
  registerAnon(input: { slug: string; displayName: string }): Promise<{ token: string; profile: Profile }>;
}

export interface SessionStore {
  save(slug: string, session: { token: string; profile: Profile }): void;
  load(slug: string): { token: string; profile: Profile } | null;
}
