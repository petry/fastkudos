import type { Feedback } from '@fastkudos/shared';
import type { MuralGateway } from '../domain/ports';

export function httpMuralGateway(baseUrl: string, fetchImpl: typeof fetch = fetch): MuralGateway {
  return {
    async list({ token }) {
      const res = await fetchImpl(`${baseUrl}/mural`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`mural_failed_${res.status}`);
      const data = (await res.json()) as { feedbacks: Feedback[] };
      return data.feedbacks;
    },
  };
}
