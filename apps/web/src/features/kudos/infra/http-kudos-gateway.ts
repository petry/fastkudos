import type { Feedback } from '@fastkudos/shared';
import type { KudosGateway } from '../domain/ports';

export function httpKudosGateway(baseUrl: string, fetchImpl: typeof fetch = fetch): KudosGateway {
  return {
    async submit({ token, receiverId, content }) {
      const res = await fetchImpl(`${baseUrl}/kudos`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ receiverId, content }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `submit_failed_${res.status}`);
      }
      const data = (await res.json()) as { feedback: Feedback };
      return data.feedback;
    },
  };
}
