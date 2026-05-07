import type { Event, Feedback, Profile, UserSession } from '@fastkudos/shared';
import type { OwnedEventsGateway, UserAuthGateway } from '../domain/ports';

export function httpUserAuthGateway(baseUrl: string, fetchImpl: typeof fetch = fetch): UserAuthGateway {
  return {
    startGoogleLogin(redirectAfter) {
      const url = new URL(`${baseUrl}/auth/google/start`);
      url.searchParams.set('redirect', redirectAfter);
      window.location.assign(url.toString());
    },
    async fetchMe(token) {
      const res = await fetchImpl(`${baseUrl}/auth/me`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `me_failed_${res.status}`);
      }
      const data = (await res.json()) as { user: UserSession };
      return data.user;
    },
  };
}

export function httpOwnedEventsGateway(baseUrl: string, fetchImpl: typeof fetch = fetch): OwnedEventsGateway {
  return {
    async create({ token, name, slug }) {
      const res = await fetchImpl(`${baseUrl}/me/events`, {
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
      const res = await fetchImpl(`${baseUrl}/me/events`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`list_failed_${res.status}`);
      return ((await res.json()) as { events: Event[] }).events;
    },
    async update({ token, eventId, patch }) {
      const res = await fetchImpl(`${baseUrl}/me/events/${encodeURIComponent(eventId)}`, {
        method: 'PATCH',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `update_failed_${res.status}`);
      }
      const data = (await res.json()) as { event: { id: string; slug: string; name: string } };
      return data.event;
    },
    async delete({ token, eventId }) {
      const res = await fetchImpl(`${baseUrl}/me/events/${encodeURIComponent(eventId)}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `delete_event_failed_${res.status}`);
      }
    },
    async feedbacks({ token, eventId }) {
      const res = await fetchImpl(`${baseUrl}/me/events/${encodeURIComponent(eventId)}/feedbacks`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`feedbacks_failed_${res.status}`);
      return ((await res.json()) as { feedbacks: Feedback[] }).feedbacks;
    },
    async deleteFeedback({ token, feedbackId }) {
      const res = await fetchImpl(`${baseUrl}/me/feedbacks/${encodeURIComponent(feedbackId)}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`delete_failed_${res.status}`);
    },
    async profiles({ token, eventId }) {
      const res = await fetchImpl(`${baseUrl}/me/events/${encodeURIComponent(eventId)}/profiles`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`profiles_failed_${res.status}`);
      return ((await res.json()) as { profiles: Profile[] }).profiles;
    },
    async deleteProfile({ token, profileId }) {
      const res = await fetchImpl(`${baseUrl}/me/profiles/${encodeURIComponent(profileId)}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`delete_profile_failed_${res.status}`);
    },
  };
}
