import type { Profile } from '@fastkudos/shared';
import type { EventSummary, ParticipantsGateway } from '../domain/ports';

export function httpParticipantsGateway(
  baseUrl: string,
  fetchImpl: typeof fetch = fetch,
): ParticipantsGateway {
  return {
    async list({ slug, token }) {
      const res = await fetchImpl(`${baseUrl}/events/${encodeURIComponent(slug)}/profiles`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `list_failed_${res.status}`);
      }
      return (await res.json()) as { event: EventSummary; profiles: Profile[] };
    },
  };
}
