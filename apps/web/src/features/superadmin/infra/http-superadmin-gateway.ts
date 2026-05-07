import type { Event } from '@fastkudos/shared';
import type { SuperadminGateway, SuperadminUser } from '../domain/ports';

export function httpSuperadminGateway(baseUrl: string, fetchImpl: typeof fetch = fetch): SuperadminGateway {
  return {
    async listEvents({ token }) {
      const res = await fetchImpl(`${baseUrl}/superadmin/events`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`list_events_failed_${res.status}`);
      return ((await res.json()) as { events: Event[] }).events;
    },
    async listUsers({ token }) {
      const res = await fetchImpl(`${baseUrl}/superadmin/users`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`list_users_failed_${res.status}`);
      return ((await res.json()) as { users: SuperadminUser[] }).users;
    },
    async updateUserRole({ token, userId, role }) {
      const res = await fetchImpl(`${baseUrl}/superadmin/users/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `update_role_failed_${res.status}`);
      }
      return ((await res.json()) as { user: SuperadminUser }).user;
    },
  };
}
