import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Database } from './db/client';
import { authRoutes } from './routes/auth';
import { eventRoutes } from './routes/events';
import { kudoRoutes } from './routes/kudos';
import { inboxRoutes } from './routes/inbox';
import { muralRoutes } from './routes/mural';
import { meEventsRoutes } from './routes/me-events';
import { superadminRoutes } from './routes/superadmin';

export { EventChannel } from './realtime/event-channel';

export interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
  /** Lista de origens separada por vírgula. Quando ausente, libera tudo (apenas dev). */
  ALLOWED_ORIGINS?: string;
  EVENT_CHANNEL: DurableObjectNamespace;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  OAUTH_REDIRECT_URI: string;
  WEB_BASE_URL: string;
  /** Apenas para testes de integração — produção usa o driver Neon. */
  DB_OVERRIDE?: Database;
}

const DEV_ORIGINS = ['http://localhost:5173', 'http://localhost:4173'];

const app = new Hono<{ Bindings: Env }>();

app.use('*', async (c, next) => {
  const list = c.env?.ALLOWED_ORIGINS;
  const allowed = list
    ? [...list.split(',').map((s) => s.trim()).filter(Boolean), ...DEV_ORIGINS]
    : '*';
  return cors({ origin: allowed, credentials: false })(c, next);
});

app.get('/health', (c) => c.json({ status: 'ok' }));

app.route('/auth', authRoutes);
app.route('/events', eventRoutes);
app.route('/kudos', kudoRoutes);
app.route('/inbox', inboxRoutes);
app.route('/mural', muralRoutes);
app.route('/me', meEventsRoutes);
app.route('/superadmin', superadminRoutes);

export default app;
