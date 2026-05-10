import type { Event, Feedback, Profile, UserSession } from '@fastkudos/shared';
import { createHttpClient } from '../../../lib/http';
import type { OwnedEventsGateway, UserAuthGateway } from '../domain/ports';

export function httpUserAuthGateway(baseUrl: string, fetchImpl: typeof fetch = fetch): UserAuthGateway {
  const http = createHttpClient(baseUrl, fetchImpl);
  return {
    startGoogleLogin(redirectAfter) {
      const url = new URL(`${baseUrl}/auth/google/start`);
      url.searchParams.set('redirect', redirectAfter);
      window.location.assign(url.toString());
    },
    async fetchMe(token) {
      const data = await http.get<{ user: UserSession }>('/auth/me', { token });
      return data.user;
    },
  };
}

export function httpOwnedEventsGateway(baseUrl: string, fetchImpl: typeof fetch = fetch): OwnedEventsGateway {
  const http = createHttpClient(baseUrl, fetchImpl);
  return {
    async create({ token, name, slug }) {
      const data = await http.post<{ event: { id: string; slug: string; name: string } }>(
        '/me/events',
        { token, body: { name, slug } },
      );
      return data.event;
    },
    async list({ token }) {
      const data = await http.get<{ events: Event[] }>('/me/events', { token });
      return data.events;
    },
    async update({ token, eventId, patch }) {
      const data = await http.patch<{ event: { id: string; slug: string; name: string } }>(
        `/me/events/${encodeURIComponent(eventId)}`,
        { token, body: patch },
      );
      return data.event;
    },
    delete({ token, eventId }) {
      return http.delete(`/me/events/${encodeURIComponent(eventId)}`, { token });
    },
    async feedbacks({ token, eventId }) {
      const data = await http.get<{ feedbacks: Feedback[] }>(
        `/me/events/${encodeURIComponent(eventId)}/feedbacks`,
        { token },
      );
      return data.feedbacks;
    },
    deleteFeedback({ token, feedbackId }) {
      return http.delete(`/me/feedbacks/${encodeURIComponent(feedbackId)}`, { token });
    },
    async profiles({ token, eventId }) {
      const data = await http.get<{ profiles: Profile[] }>(
        `/me/events/${encodeURIComponent(eventId)}/profiles`,
        { token },
      );
      return data.profiles;
    },
    deleteProfile({ token, profileId }) {
      return http.delete(`/me/profiles/${encodeURIComponent(profileId)}`, { token });
    },
  };
}
