import { describe, expect, it } from 'vitest';
import type { Bet, Wallet } from '../src/db/schema';
import { calculatePayout, settleBets, validateBet } from '../src/services/betting-engine';

function makeWallet(overrides: Partial<Wallet> = {}): Wallet {
  return { id: 'w1', profile_id: 'p1', balance: 1000, updated_at: '', ...overrides };
}

function makeBet(overrides: Partial<Bet> = {}): Bet {
  return {
    id: '',
    profile_id: 'p1',
    match_id: 'm1',
    bet_type: 'HOME',
    amount: 100,
    potential_payout: 200,
    status: 'PENDING',
    created_at: '',
    ...overrides,
  };
}

describe('betting-engine', () => {
  describe('calculatePayout', () => {
    it('should multiply amount by odds', () => {
      expect(calculatePayout(100, 2.0)).toBe(200);
      expect(calculatePayout(50, 1.85)).toBe(92.5);
    });
  });

  describe('validateBet', () => {
    it('should pass when balance covers the bet', () => {
      const wallet = makeWallet({ balance: 500 });
      const result = validateBet(wallet, 300);
      expect(result.valid).toBe(true);
    });

    it('should fail when balance is insufficient', () => {
      const wallet = makeWallet({ balance: 50 });
      const result = validateBet(wallet, 100);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Insufficient balance');
    });

    it('should fail for zero or negative amount', () => {
      const wallet = makeWallet({ balance: 500 });
      expect(validateBet(wallet, 0).valid).toBe(false);
      expect(validateBet(wallet, -10).valid).toBe(false);
    });
  });

  describe('settleBets', () => {
    it('should mark HOME bets as WON when home team wins', () => {
      const bets = [
        makeBet({
          id: 'b1',
          bet_type: 'HOME',
          amount: 100,
          potential_payout: 200,
          status: 'PENDING',
        }),
        makeBet({
          id: 'b2',
          bet_type: 'AWAY',
          amount: 50,
          potential_payout: 200,
          status: 'PENDING',
        }),
        makeBet({
          id: 'b3',
          bet_type: 'DRAW',
          amount: 30,
          potential_payout: 105,
          status: 'PENDING',
        }),
      ];
      const result = settleBets(bets, { homeScore: 2, awayScore: 1 });
      expect(result.find((r) => r.betId === 'b1')?.status).toBe('WON');
      expect(result.find((r) => r.betId === 'b2')?.status).toBe('LOST');
      expect(result.find((r) => r.betId === 'b3')?.status).toBe('LOST');
    });

    it('should mark DRAW bets as WON when scores are equal', () => {
      const bets = [
        makeBet({
          id: 'b1',
          bet_type: 'HOME',
          amount: 100,
          potential_payout: 200,
          status: 'PENDING',
        }),
        makeBet({
          id: 'b2',
          bet_type: 'DRAW',
          amount: 50,
          potential_payout: 175,
          status: 'PENDING',
        }),
      ];
      const result = settleBets(bets, { homeScore: 1, awayScore: 1 });
      expect(result.find((r) => r.betId === 'b1')?.status).toBe('LOST');
      expect(result.find((r) => r.betId === 'b2')?.status).toBe('WON');
    });

    it('should skip already settled bets', () => {
      const bets = [
        makeBet({ id: 'b1', bet_type: 'HOME', amount: 100, potential_payout: 200, status: 'WON' }),
      ];
      const result = settleBets(bets, { homeScore: 2, awayScore: 1 });
      expect(result).toHaveLength(0);
    });

    it('should calculate correct winnings', () => {
      const bets = [
        makeBet({
          id: 'b1',
          bet_type: 'HOME',
          amount: 100,
          potential_payout: 200,
          status: 'PENDING',
        }),
      ];
      const result = settleBets(bets, { homeScore: 3, awayScore: 0 });
      expect(result[0]?.payout).toBe(200);
    });
  });
});
