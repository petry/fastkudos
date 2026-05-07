import type { Feedback } from '@fastkudos/shared';
import type { InboxGateway } from '../domain/ports';

export function httpInboxGateway(baseUrl: string, fetchImpl: typeof fetch = fetch): InboxGateway {
  return {
    async list({ token }) {
      const res = await fetchImpl(`${baseUrl}/inbox`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`inbox_failed_${res.status}`);
      const data = (await res.json()) as { feedbacks: Feedback[] };
      return data.feedbacks;
    },
  };
}
