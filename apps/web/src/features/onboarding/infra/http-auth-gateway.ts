import type { Profile } from '@fastkudos/shared';
import type { AuthGateway } from '../domain/ports';

export function httpAuthGateway(baseUrl: string, fetchImpl: typeof fetch = fetch): AuthGateway {
  return {
    async registerAnon({ slug, displayName }) {
      const res = await fetchImpl(`${baseUrl}/auth/anon`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, displayName }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `auth_failed_${res.status}`);
      }
      return (await res.json()) as { token: string; profile: Profile };
    },
    async eventJoin({ slug, userToken }) {
      const res = await fetchImpl(`${baseUrl}/auth/event-join`, {
        method: 'POST',
        headers: { authorization: `Bearer ${userToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `event_join_failed_${res.status}`);
      }
      return (await res.json()) as { token: string; profile: Profile };
    },
  };
}
