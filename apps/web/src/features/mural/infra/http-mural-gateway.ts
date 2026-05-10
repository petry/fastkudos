import type { Feedback } from '@fastkudos/shared';
import { createHttpClient } from '../../../lib/http';
import type { MuralGateway } from '../domain/ports';

export function httpMuralGateway(baseUrl: string, fetchImpl: typeof fetch = fetch): MuralGateway {
  const http = createHttpClient(baseUrl, fetchImpl);
  return {
    async list({ token }) {
      const data = await http.get<{ feedbacks: Feedback[] }>('/mural', { token });
      return data.feedbacks;
    },
  };
}
