import { Hono } from 'hono';
import { getSupabaseClient } from '../db/client';

export const matchesRoutes = new Hono();

matchesRoutes.get('/', async (c) => {
  const supabase = getSupabaseClient();
  const round = c.req.query('round');
  let query = supabase.from('matches').select('*').order('round_number', { ascending: true });

  if (round) {
    query = query.eq('round_number', parseInt(round, 10));
  }

  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

matchesRoutes.get('/:id', async (c) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('matches')
    .select('*, red_cards(*), odds(*)')
    .eq('id', c.req.param('id'))
    .single();

  if (error) return c.json({ error: error.message }, 404);
  return c.json(data);
});
