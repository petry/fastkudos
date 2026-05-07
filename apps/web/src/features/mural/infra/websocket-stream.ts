import type { EventStream } from '../domain/ports';
import type { MuralEvent } from '../domain/types';

export function websocketStream(baseHttpUrl: string): EventStream {
  const wsUrl = baseHttpUrl.replace(/^http/, 'ws');
  return {
    subscribe({ slug, token }, handler) {
      const url = `${wsUrl}/events/${encodeURIComponent(slug)}/stream?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
      ws.addEventListener('message', (ev) => {
        try {
          const parsed = JSON.parse(ev.data as string) as MuralEvent;
          handler(parsed);
        } catch {
          /* ignora mensagens não-JSON */
        }
      });
      return () => {
        try {
          ws.close();
        } catch {
          /* ignora */
        }
      };
    },
  };
}
