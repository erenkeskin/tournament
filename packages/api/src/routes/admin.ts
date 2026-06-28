import { Hono } from 'hono';
import { getSupabaseClient } from '../db/client';
import { settleBets } from '../services/betting-engine';
import { calculateStandings, generateFixtures, sortStandings } from '../services/league-engine';
import { generatePlayoffBracket, validatePlayoffResult } from '../services/playoff-engine';
import { allocateTeam, getAvailableNations } from '../services/team-allocation';

export const adminRoutes = new Hono();

// Submit match score
adminRoutes.post('/matches/:id/score', async (c) => {
  const supabase = getSupabaseClient();
  const matchId = c.req.param('id');
  const body = await c.req.json();
  const {
    homeScore,
    awayScore,
    redCards,
    extraTimeHome,
    extraTimeAway,
    penaltiesHome,
    penaltiesAway,
  } = body;

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (matchError || !match) return c.json({ error: 'Match not found' }, 404);
  if (match.is_played) return c.json({ error: 'Match already played' }, 400);

  if (match.stage === 'PLAYOFF') {
    const validation = validatePlayoffResult({
      homeScore,
      awayScore,
      extraTimeHome,
      extraTimeAway,
      penaltiesHome,
      penaltiesAway,
    });
    if (!validation.valid) return c.json({ error: validation.reason }, 400);
  }

  const playoffMeta =
    match.stage === 'PLAYOFF'
      ? {
          extra_time_home: extraTimeHome,
          extra_time_away: extraTimeAway,
          penalties_home: penaltiesHome,
          penalties_away: penaltiesAway,
        }
      : null;

  const { error: updateError } = await supabase
    .from('matches')
    .update({
      home_score: homeScore,
      away_score: awayScore,
      is_played: true,
      playoff_metadata: playoffMeta,
    })
    .eq('id', matchId);

  if (updateError) return c.json({ error: updateError.message }, 500);

  if (redCards && redCards.length > 0) {
    const cards = redCards.map((rc: { playerId: string; playerName: string }) => ({
      match_id: matchId,
      player_id: rc.playerId,
      player_name_string: rc.playerName,
    }));
    await supabase.from('red_cards').insert(cards);
  }

  // Settle bets
  const { data: bets } = await supabase.from('bets').select('*').eq('match_id', matchId);
  if (bets && bets.length > 0) {
    const settlements = settleBets(bets, { homeScore, awayScore });
    for (const s of settlements) {
      const { data: bet } = await supabase
        .from('bets')
        .select('*, profiles!inner(*)')
        .eq('id', s.betId)
        .single();

      if (!bet || s.status === 'LOST') {
        await supabase.from('bets').update({ status: 'LOST' }).eq('id', s.betId);
        continue;
      }

      const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('profile_id', bet.profile_id)
        .single();

      if (wallet) {
        await supabase.rpc('credit_winnings', {
          wallet_id: wallet.id,
          amount: s.payout,
          bet_id: s.betId,
        });
      }
      await supabase.from('bets').update({ status: 'WON' }).eq('id', s.betId);
    }
  }

  return c.json({ success: true });
});

// Force forfeit
adminRoutes.post('/matches/:id/forfeit', async (c) => {
  const supabase = getSupabaseClient();
  const matchId = c.req.param('id');

  const { error } = await supabase
    .from('matches')
    .update({ home_score: 3, away_score: 0, is_played: true, is_forfeit: true })
    .eq('id', matchId);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

// Team allocation
adminRoutes.post('/teams/allocate', async (c) => {
  const supabase = getSupabaseClient();
  const body = await c.req.json();
  const { profileId } = body;

  const { data: profiles } = await supabase.from('profiles').select('id, selected_team');

  const assigned = new Map<string, string>();
  for (const p of profiles || []) {
    if (p.selected_team) assigned.set(p.id, p.selected_team);
  }

  const available = getAvailableNations(assigned);
  const result = allocateTeam(available, assigned);

  if (!result) return c.json({ error: 'No teams available' }, 400);

  const { error } = await supabase
    .from('profiles')
    .update({ selected_team: result.nation })
    .eq('id', profileId);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ profileId, nation: result.nation });
});

// Remaining teams for wheel
adminRoutes.get('/teams/wheel', async (c) => {
  const supabase = getSupabaseClient();
  const { data: profiles } = await supabase.from('profiles').select('id, selected_team');

  const assigned = new Map<string, string>();
  for (const p of profiles || []) {
    if (p.selected_team) assigned.set(p.id, p.selected_team);
  }

  return c.json(getAvailableNations(assigned));
});

// Set odds
adminRoutes.post('/odds', async (c) => {
  const supabase = getSupabaseClient();
  const body = await c.req.json();
  const { matchId, oddsHome, oddsDraw, oddsAway, oddsUnder, oddsOver } = body;

  const { data, error } = await supabase
    .from('odds')
    .upsert({
      match_id: matchId,
      odds_home: oddsHome,
      odds_draw: oddsDraw,
      odds_away: oddsAway,
	      odds_under: oddsUnder ?? null,
	      odds_over: oddsOver ?? null,
    })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data, 201);
});

// Audit log
adminRoutes.get('/audit', async (c) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('transactions_log')
    .select('*, wallets(profile_id)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// List all players
adminRoutes.get('/players', async (c) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, selected_team, is_admin, created_at')
    .order('created_at', { ascending: true });

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// Generate league fixtures
adminRoutes.post('/generate-fixtures', async (c) => {
  const supabase = getSupabaseClient();
  const body = await c.req.json();
  const { playerIds } = body;

  if (!playerIds || playerIds.length < 2) {
    return c.json({ error: 'At least 2 players required' }, 400);
  }

  // Check for existing league matches
  const { data: existing } = await supabase
    .from('matches')
    .select('id')
    .eq('stage', 'LEAGUE')
    .limit(1);

  if (existing && existing.length > 0) {
    return c.json({ error: 'League fixtures already exist. Delete existing matches first.' }, 400);
  }

  const fixtures = generateFixtures(playerIds);
  const { data, error } = await supabase.from('matches').insert(fixtures).select();

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ matches: data, count: data.length }, 201);
});

// Generate playoff bracket
adminRoutes.post('/generate-playoffs', async (c) => {
  const supabase = getSupabaseClient();

  // Get all league matches for standings
  const { data: matches } = await supabase.from('matches').select('*').eq('stage', 'LEAGUE');

  const { data: profiles } = await supabase.from('profiles').select('id, username, selected_team');

  const playerNames: Record<string, string> = {};
  const playerTeams: Record<string, string> = {};
  for (const p of profiles || []) {
    playerNames[p.id] = p.username;
    playerTeams[p.id] = p.selected_team || '';
  }

  const standings = calculateStandings(matches || [], playerNames, playerTeams);
  const sorted = sortStandings(standings, matches || []);
  const top4 = sorted.slice(0, 4);

  if (top4.length < 4) {
    return c.json({ error: 'Not enough players for playoffs (need 4)' }, 400);
  }

  // Check for existing playoff matches
  const { data: existingPlayoff } = await supabase
    .from('matches')
    .select('id')
    .eq('stage', 'PLAYOFF')
    .limit(1);

  if (existingPlayoff && existingPlayoff.length > 0) {
    return c.json({ error: 'Playoff matches already exist' }, 400);
  }

  const bracket = generatePlayoffBracket(top4);
  const { data, error } = await supabase.from('matches').insert(bracket.semiFinals).select();

  if (error) return c.json({ error: error.message }, 500);

  return c.json(
    {
      matches: data,
      top4: top4.map((r) => ({ playerId: r.playerId, username: r.username, points: r.points })),
    },
    201,
  );
});

// Promote user to admin (admin only)
adminRoutes.post('/promote-admin', async (c) => {
  const supabase = getSupabaseClient();
  const body = await c.req.json();
  const { profileId } = body;

  const { error } = await supabase.from('profiles').update({ is_admin: true }).eq('id', profileId);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

// Approve tournament application
adminRoutes.post('/applications/:id/approve', async (c) => {
  const supabase = getSupabaseClient();
  const profileId = c.req.param('id');

  const { error } = await supabase
    .from('profiles')
    .update({ tournament_status: 'APPROVED' })
    .eq('id', profileId);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

// Reject tournament application
adminRoutes.post('/applications/:id/reject', async (c) => {
  const supabase = getSupabaseClient();
  const profileId = c.req.param('id');

  const { error } = await supabase
    .from('profiles')
    .update({ tournament_status: 'REJECTED' })
    .eq('id', profileId);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

// Reset entire tournament
adminRoutes.post('/reset', async (c) => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc('reset_tournament');
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true, message: 'Turnuva sıfırlandı' });
});
