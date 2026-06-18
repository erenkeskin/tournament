import { createMiddleware } from 'hono/factory';
import { getSupabaseClient } from '../db/client';
import type { Profile } from '../db/schema';

declare module 'hono' {
  interface ContextVariableMap {
    user: Profile;
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  if (!profile) {
    return c.json({ error: 'Profile not found' }, 404);
  }

  c.set('user', profile as Profile);
  await next();
});
