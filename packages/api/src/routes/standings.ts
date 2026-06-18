import { Hono } from 'hono';
import { getSupabaseClient } from '../db/client';
import { calculateStandings, sortStandings } from '../services/league-engine';

export const standingsRoutes = new Hono();

standingsRoutes.get('/', async (c) => {
  const supabase = getSupabaseClient();

  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('stage', 'LEAGUE');

  if (matchError) return c.json({ error: matchError.message }, 500);

  const { data: profiles } = await supabase.from('profiles').select('id, username, selected_team');

  const playerNames: Record<string, string> = {};
  const playerTeams: Record<string, string> = {};
  for (const p of profiles || []) {
    playerNames[p.id] = p.username;
    playerTeams[p.id] = p.selected_team || '';
  }

  const standings = calculateStandings(matches || [], playerNames, playerTeams);
  const sorted = sortStandings(standings, matches || []);

  return c.json(sorted);
});
