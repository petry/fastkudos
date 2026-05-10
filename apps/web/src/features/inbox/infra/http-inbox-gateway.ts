import type { Feedback } from '@fastkudos/shared';
import { createHttpClient } from '../../../lib/http';
import type { InboxGateway } from '../domain/ports';

export function httpInboxGateway(baseUrl: string, fetchImpl: typeof fetch = fetch): InboxGateway {
  const http = createHttpClient(baseUrl, fetchImpl);
  return {
    async list({ token }) {
      const data = await http.get<{ feedbacks: Feedback[] }>('/inbox', { token });
      return data.feedbacks;
    },
  };
}
