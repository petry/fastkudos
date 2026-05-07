import type { Feedback } from '@fastkudos/shared';
import type { RealtimePublisher } from '../features/kudos/domain/ports';

export function durableObjectPublisher(ns: DurableObjectNamespace): RealtimePublisher {
  return {
    async publish(eventId, payload) {
      const stub = ns.get(ns.idFromName(eventId));
      await stub.fetch('https://channel/publish', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  };
}

export const noopPublisher: RealtimePublisher = {
  async publish(_eventId: string, _payload: { type: 'kudo.created'; feedback: Feedback }) {
    /* no-op para ambientes sem DO (ex: testes) */
  },
};
