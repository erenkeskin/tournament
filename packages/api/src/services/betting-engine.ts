import type { Bet, BetStatus, BetType, Wallet } from '../db/schema';

export function calculatePayout(amount: number, odds: number): number {
  return Math.round(amount * odds * 100) / 100;
}

export function validateBet(wallet: Wallet, amount: number): { valid: boolean; reason?: string } {
  if (amount <= 0) return { valid: false, reason: 'Bet amount must be positive' };
  if (wallet.balance < amount) return { valid: false, reason: 'Insufficient balance' };
  return { valid: true };
}

export interface MatchResult {
  homeScore: number;
  awayScore: number;
}

export interface SettlementEntry {
  betId: string;
  status: BetStatus;
  payout: number;
  walletId: string;
}

export function determineBetResult(betType: BetType, result: MatchResult): 'WON' | 'LOST' {
  // 1-X-2
  if (betType === 'HOME') return result.homeScore > result.awayScore ? 'WON' : 'LOST';
  if (betType === 'AWAY') return result.awayScore > result.homeScore ? 'WON' : 'LOST';
  if (betType === 'DRAW') return result.homeScore === result.awayScore ? 'WON' : 'LOST';
  // Under/Over 2.5
  const totalGoals = result.homeScore + result.awayScore;
  if (betType === 'UNDER') return totalGoals < 2.5 ? 'WON' : 'LOST';
  if (betType === 'OVER') return totalGoals > 2.5 ? 'WON' : 'LOST';
  return 'LOST';
}

export function settleBets(bets: Bet[], result: MatchResult): SettlementEntry[] {
  const pending = bets.filter((b) => b.status === 'PENDING');
  if (pending.length === 0) return [];

  return pending.map((bet) => {
    const outcome = determineBetResult(bet.bet_type, result);
    return {
      betId: bet.id,
      status: outcome,
      payout: outcome === 'WON' ? bet.potential_payout : 0,
      walletId: '',
    };
  });
}
