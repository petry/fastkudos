import { submitKudoResponse } from '@fastkudos/shared';
import { createHttpClient } from '../../../lib/http';
import type { KudosGateway } from '../domain/ports';

export function httpKudosGateway(baseUrl: string, fetchImpl: typeof fetch = fetch): KudosGateway {
  const http = createHttpClient(baseUrl, fetchImpl);
  return {
    async submit({ token, receiverId, content }) {
      const data = await http.post('/kudos', { token, body: { receiverId, content } });
      return submitKudoResponse.parse(data).feedback;
    },
  };
}
