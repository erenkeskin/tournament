import { Hono } from 'hono';
import { getSupabaseClient } from '../db/client';
import { calculatePayout, validateBet } from '../services/betting-engine';

export const betsRoutes = new Hono();

betsRoutes.get('/', async (c) => {
  const user = c.get('user');
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('bets')
    .select('*, matches(*)')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

betsRoutes.post('/', async (c) => {
  const user = c.get('user');
  const supabase = getSupabaseClient();
  const body = await c.req.json();
  const { matchId, betType, amount } = body;

  const { data: wallet } = await supabase
    .from('wallets')
    .select('*')
    .eq('profile_id', user.id)
    .single();

  if (!wallet) return c.json({ error: 'Wallet not found' }, 404);

  const validation = validateBet(wallet, amount);
  if (!validation.valid) {
    return c.json({ error: validation.reason }, 400);
  }

  const { data: odds } = await supabase.from('odds').select('*').eq('match_id', matchId).single();

  if (!odds) return c.json({ error: 'Odds not available for this match' }, 400);

  const oddsValue =
    betType === 'HOME' ? odds.odds_home : betType === 'DRAW' ? odds.odds_draw : odds.odds_away;
  const payout = calculatePayout(amount, oddsValue);

  const { data: bet, error: betError } = await supabase
    .from('bets')
    .insert({
      profile_id: user.id,
      match_id: matchId,
      bet_type: betType,
      amount,
      potential_payout: payout,
    })
    .select()
    .single();

  if (betError) return c.json({ error: betError.message }, 500);

  const { error: rpcError } = await supabase.rpc('deduct_balance', {
    wallet_id: wallet.id,
    amount,
    bet_id: bet.id,
  });

  if (rpcError) {
    await supabase.from('bets').delete().eq('id', bet.id);
    return c.json({ error: rpcError.message }, 400);
  }

  return c.json(bet, 201);
});
