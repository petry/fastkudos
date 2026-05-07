// Durable Object: 1 instância por event_id, faz fan-out de mensagens via WebSocket.
// Implementação mínima — features de produto vão estendê-la por TDD.

export class EventChannel {
  private sockets = new Set<WebSocket>();

  constructor(_state: DurableObjectState, _env: unknown) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/connect') {
      const upgrade = request.headers.get('Upgrade');
      if (upgrade !== 'websocket') return new Response('expected websocket', { status: 426 });
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
      server.accept();
      this.sockets.add(server);
      server.addEventListener('close', () => this.sockets.delete(server));
      server.addEventListener('error', () => this.sockets.delete(server));
      return new Response(null, { status: 101, webSocket: client });
    }

    if (url.pathname === '/publish' && request.method === 'POST') {
      const body = await request.text();
      for (const ws of this.sockets) {
        try {
          ws.send(body);
        } catch {
          this.sockets.delete(ws);
        }
      }
      return new Response(null, { status: 204 });
    }

    return new Response('not found', { status: 404 });
  }
}
