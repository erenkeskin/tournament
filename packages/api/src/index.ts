import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getSupabaseClient } from './db/client';
import { adminMiddleware } from './middleware/admin';
import { authMiddleware } from './middleware/auth';
import { adminRoutes } from './routes/admin';
import { betsRoutes } from './routes/bets';
import { matchesRoutes } from './routes/matches';
import { standingsRoutes } from './routes/standings';

export { getSupabaseAdmin, getSupabaseClient } from './db/client';
export * from './db/schema';
export * from './lib/errors';

const app = new Hono();

app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }),
);

// Health check (no auth)
app.get('/api/health', (c) => c.json({ status: 'ok' }));

// All routes below /api require auth
const api = app.basePath('/api');
api.use('*', authMiddleware);

// Public authed routes
api.get('/wallet', async (c) => {
  const user = c.get('user');
  const supabase = getSupabaseClient();
  const { data } = await supabase.from('wallets').select('*').eq('profile_id', user.id).single();
  return c.json(data);
});

api.route('/matches', matchesRoutes);
api.route('/standings', standingsRoutes);
api.route('/bets', betsRoutes);

// Admin routes (middleware first, then routes)
const admin = api.basePath('/admin');
admin.use('*', adminMiddleware);
admin.route('/', adminRoutes);

export default {
  port: parseInt(process.env.PORT || '3000', 10),
  fetch: app.fetch,
};
