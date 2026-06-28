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

export function createApp() {
  const app = new Hono();

  const allowedOrigins = (
    process.env.ALLOWED_ORIGINS ||
    'http://localhost:5173,http://localhost:3000,http://localhost:8888'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    '*',
    cors({
      origin: allowedOrigins,
      allowHeaders: ['Authorization', 'Content-Type'],
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    }),
  );

  // Health check
  app.get('/api/health', (c) => c.json({ status: 'ok' }));

  const api = app.basePath('/api');

  // PUBLIC routes — no auth needed
  api.route('/matches', matchesRoutes);
  api.route('/standings', standingsRoutes);

  // Public player list (no auth)
  api.get('/players', async (c) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, selected_team, avatar_url, tournament_status')
      .order('created_at', { ascending: true });

    if (error) return c.json({ error: error.message }, 500);
    return c.json(data);
  });

  // AUTH-REQUIRED routes
  const authed = api.basePath('/');
  authed.use('*', authMiddleware as never);

  authed.get('/wallet', async (c) => {
    const user = c.get('user');
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('wallets')
      .select('*')
      .eq('profile_id', user.id)
      .single();
    return c.json(data);
  });

  authed.route('/bets', betsRoutes);

  // ADMIN routes
  const admin = api.basePath('/admin');
  admin.use('*', adminMiddleware as never);
  admin.route('/', adminRoutes);

  return app;
}

// Bun dev server
const app = createApp();

export default {
  port: parseInt(process.env.PORT || '3000', 10),
  fetch: app.fetch,
};
