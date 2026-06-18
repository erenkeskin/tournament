import { describe, expect, it } from 'vitest';
import type { StandingRow } from '../src/db/schema';
import { generatePlayoffBracket, validatePlayoffResult } from '../src/services/playoff-engine';

function makeStandingRow(overrides: Partial<StandingRow> = {}): StandingRow {
  return {
    playerId: '',
    username: '',
    team: null,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    ...overrides,
  };
}

describe('playoff-engine', () => {
  describe('generatePlayoffBracket', () => {
    it('should seed 1v4 and 2v3', () => {
      const top4 = [
        makeStandingRow({ playerId: 'p1', username: 'First' }),
        makeStandingRow({ playerId: 'p2', username: 'Second' }),
        makeStandingRow({ playerId: 'p3', username: 'Third' }),
        makeStandingRow({ playerId: 'p4', username: 'Fourth' }),
      ];
      const bracket = generatePlayoffBracket(top4);
      expect(bracket.semiFinals).toHaveLength(2);
      expect(bracket.semiFinals[0]?.home_player_id).toBe('p1');
      expect(bracket.semiFinals[0]?.away_player_id).toBe('p4');
      expect(bracket.semiFinals[1]?.home_player_id).toBe('p2');
      expect(bracket.semiFinals[1]?.away_player_id).toBe('p3');
    });

    it('should throw if not exactly 4 players', () => {
      expect(() => generatePlayoffBracket([])).toThrow();
      expect(() => generatePlayoffBracket([makeStandingRow({ playerId: 'p1' })])).toThrow();
    });
  });

  describe('validatePlayoffResult', () => {
    it('should reject a draw in regular time', () => {
      const result = validatePlayoffResult({ homeScore: 1, awayScore: 1 });
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('draw');
    });

    it('should accept a win in regular time', () => {
      const result = validatePlayoffResult({ homeScore: 2, awayScore: 1 });
      expect(result.valid).toBe(true);
    });

    it('should accept a result with extra time scores that are not tied', () => {
      const result = validatePlayoffResult({
        homeScore: 1,
        awayScore: 1,
        extraTimeHome: 1,
        extraTimeAway: 0,
      });
      expect(result.valid).toBe(true);
    });

    it('should accept a result settled by penalties', () => {
      const result = validatePlayoffResult({
        homeScore: 1,
        awayScore: 1,
        extraTimeHome: 0,
        extraTimeAway: 0,
        penaltiesHome: 5,
        penaltiesAway: 4,
      });
      expect(result.valid).toBe(true);
    });

    it('should reject if extra time still tied and no penalties', () => {
      const result = validatePlayoffResult({
        homeScore: 1,
        awayScore: 1,
        extraTimeHome: 1,
        extraTimeAway: 1,
      });
      expect(result.valid).toBe(false);
    });
  });
});
