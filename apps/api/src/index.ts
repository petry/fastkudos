import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Database } from './db/client';
import { authRoutes } from './routes/auth';
import { eventRoutes } from './routes/events';
import { kudoRoutes } from './routes/kudos';
import { inboxRoutes } from './routes/inbox';
import { adminRoutes } from './routes/admin';

export { EventChannel } from './realtime/event-channel';

export interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
  EVENT_CHANNEL: DurableObjectNamespace;
  /** Apenas para testes de integração — produção usa o driver Neon. */
  DB_OVERRIDE?: Database;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

app.get('/health', (c) => c.json({ status: 'ok' }));

app.route('/auth', authRoutes);
app.route('/events', eventRoutes);
app.route('/kudos', kudoRoutes);
app.route('/inbox', inboxRoutes);
app.route('/admin', adminRoutes);

export default app;
