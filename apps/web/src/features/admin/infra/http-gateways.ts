import type { Event, Feedback } from '@fastkudos/shared';
import type { AdminAuthGateway, AdminEventsGateway } from '../domain/ports';

export function httpAdminAuthGateway(baseUrl: string, fetchImpl: typeof fetch = fetch): AdminAuthGateway {
  return {
    async login({ email, password }) {
      const res = await fetchImpl(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `login_failed_${res.status}`);
      }
      return (await res.json()) as { token: string; admin: { id: string; email: string } };
    },
  };
}

export function httpAdminEventsGateway(baseUrl: string, fetchImpl: typeof fetch = fetch): AdminEventsGateway {
  return {
    async create({ token, name, slug }) {
      const res = await fetchImpl(`${baseUrl}/admin/events`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `create_failed_${res.status}`);
      }
      const data = (await res.json()) as { event: { id: string; slug: string; name: string } };
      return data.event;
    },
    async list({ token }) {
      const res = await fetchImpl(`${baseUrl}/admin/events`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`list_failed_${res.status}`);
      return ((await res.json()) as { events: Event[] }).events;
    },
    async feedbacks({ token, eventId }) {
      const res = await fetchImpl(`${baseUrl}/admin/events/${encodeURIComponent(eventId)}/feedbacks`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`feedbacks_failed_${res.status}`);
      return ((await res.json()) as { feedbacks: Feedback[] }).feedbacks;
    },
    async deleteFeedback({ token, feedbackId }) {
      const res = await fetchImpl(`${baseUrl}/admin/feedbacks/${encodeURIComponent(feedbackId)}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`delete_failed_${res.status}`);
    },
  };
}
