import type { Profile } from '@fastkudos/shared';
import { createHttpClient } from '../../../lib/http';
import type { EventSummary, ParticipantsGateway } from '../domain/ports';

export function httpParticipantsGateway(
  baseUrl: string,
  fetchImpl: typeof fetch = fetch,
): ParticipantsGateway {
  const http = createHttpClient(baseUrl, fetchImpl);
  return {
    list({ slug, token }) {
      return http.get<{ event: EventSummary; profiles: Profile[] }>(
        `/events/${encodeURIComponent(slug)}/profiles`,
        { token },
      );
    },
  };
}
