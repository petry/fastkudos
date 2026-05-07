import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRoutes } from './routes/auth';
import { eventRoutes } from './routes/events';
import { kudoRoutes } from './routes/kudos';
import { inboxRoutes } from './routes/inbox';

export { EventChannel } from './realtime/event-channel';

export interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
  EVENT_CHANNEL: DurableObjectNamespace;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

app.get('/health', (c) => c.json({ status: 'ok' }));

app.route('/auth', authRoutes);
app.route('/events', eventRoutes);
app.route('/kudos', kudoRoutes);
app.route('/inbox', inboxRoutes);

export default app;
