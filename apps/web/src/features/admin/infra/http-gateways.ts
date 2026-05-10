import {
  createEventResponse,
  meEventFeedbacksResponse,
  meEventProfilesResponse,
  meEventsListResponse,
  meResponse,
  updateEventResponse,
} from '@fastkudos/shared';
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
      const data = await http.get('/auth/me', { token });
      return meResponse.parse(data).user;
    },
  };
}

export function httpOwnedEventsGateway(baseUrl: string, fetchImpl: typeof fetch = fetch): OwnedEventsGateway {
  const http = createHttpClient(baseUrl, fetchImpl);
  return {
    async create({ token, name, slug }) {
      const data = await http.post('/me/events', { token, body: { name, slug } });
      return createEventResponse.parse(data).event;
    },
    async list({ token }) {
      const data = await http.get('/me/events', { token });
      return meEventsListResponse.parse(data).events;
    },
    async update({ token, eventId, patch }) {
      const data = await http.patch(`/me/events/${encodeURIComponent(eventId)}`, {
        token,
        body: patch,
      });
      return updateEventResponse.parse(data).event;
    },
    delete({ token, eventId }) {
      return http.delete(`/me/events/${encodeURIComponent(eventId)}`, { token });
    },
    async feedbacks({ token, eventId }) {
      const data = await http.get(`/me/events/${encodeURIComponent(eventId)}/feedbacks`, { token });
      return meEventFeedbacksResponse.parse(data).feedbacks;
    },
    deleteFeedback({ token, feedbackId }) {
      return http.delete(`/me/feedbacks/${encodeURIComponent(feedbackId)}`, { token });
    },
    async profiles({ token, eventId }) {
      const data = await http.get(`/me/events/${encodeURIComponent(eventId)}/profiles`, { token });
      return meEventProfilesResponse.parse(data).profiles;
    },
    deleteProfile({ token, profileId }) {
      return http.delete(`/me/profiles/${encodeURIComponent(profileId)}`, { token });
    },
  };
}
