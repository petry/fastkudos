import { Hono } from 'hono';
import { cors } from 'hono/cors';

export { EventChannel } from './realtime/event-channel';

export interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
  EVENT_CHANNEL: DurableObjectNamespace;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

app.get('/health', (c) => c.json({ status: 'ok' }));

// Próximas iterações (TDD) montarão rotas em src/routes e plugarão aqui.

export default app;
