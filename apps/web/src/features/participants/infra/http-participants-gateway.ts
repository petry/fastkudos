import { participantsListResponse } from '@fastkudos/shared';
import { createHttpClient } from '../../../lib/http';
import type { ParticipantsGateway } from '../domain/ports';

export function httpParticipantsGateway(
  baseUrl: string,
  fetchImpl: typeof fetch = fetch,
): ParticipantsGateway {
  const http = createHttpClient(baseUrl, fetchImpl);
  return {
    async list({ slug, token }) {
      const data = await http.get(`/events/${encodeURIComponent(slug)}/profiles`, { token });
      return participantsListResponse.parse(data);
    },
  };
}
