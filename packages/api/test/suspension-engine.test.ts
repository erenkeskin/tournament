import { describe, expect, it } from 'vitest';
import type { Match, RedCard } from '../src/db/schema';
import {
  getNextMatchForPlayer,
  getSuspendedPlayers,
  validateLineup,
} from '../src/services/suspension-engine';

function makeRedCard(overrides: Partial<RedCard> = {}): RedCard {
  return {
    id: '',
    match_id: '',
    player_id: '',
    player_name_string: 'Unknown',
    served_in_match_id: null,
    ...overrides,
  };
}

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: '',
    stage: 'LEAGUE',
    home_player_id: '',
    away_player_id: '',
    home_score: null,
    away_score: null,
    is_played: false,
    is_forfeit: false,
    match_date: null,
    round_number: null,
    playoff_metadata: null,
    created_at: '',
    ...overrides,
  };
}

describe('suspension-engine', () => {
  describe('getNextMatchForPlayer', () => {
    it('should return the next unplayed match the player participates in', () => {
      const matches = [
        makeMatch({
          id: 'm1',
          home_player_id: 'p1',
          away_player_id: 'p2',
          round_number: 1,
          is_played: true,
        }),
        makeMatch({
          id: 'm2',
          home_player_id: 'p3',
          away_player_id: 'p1',
          round_number: 2,
          is_played: false,
        }),
        makeMatch({
          id: 'm3',
          home_player_id: 'p1',
          away_player_id: 'p4',
          round_number: 3,
          is_played: false,
        }),
      ];
      const next = getNextMatchForPlayer('p1', matches);
      expect(next).not.toBeNull();
      expect(next?.id).toBe('m2');
    });

    it('should return null if no upcoming match', () => {
      const matches = [
        makeMatch({
          id: 'm1',
          home_player_id: 'p1',
          away_player_id: 'p2',
          round_number: 1,
          is_played: true,
        }),
      ];
      const next = getNextMatchForPlayer('p1', matches);
      expect(next).toBeNull();
    });
  });

  describe('getSuspendedPlayers', () => {
    it('should identify players with unserved red cards for their next match', () => {
      const redCards = [
        makeRedCard({
          id: 'r1',
          match_id: 'm1',
          player_id: 'p1',
          player_name_string: 'Messi',
          served_in_match_id: null,
        }),
      ];
      const matches = [
        makeMatch({
          id: 'm1',
          home_player_id: 'p1',
          away_player_id: 'p2',
          round_number: 1,
          is_played: true,
        }),
        makeMatch({
          id: 'm2',
          home_player_id: 'p3',
          away_player_id: 'p1',
          round_number: 2,
          is_played: false,
        }),
      ];
      const suspended = getSuspendedPlayers(redCards, matches, 'm2');
      expect(suspended.has('p1')).toBe(true);
    });

    it('should not include cards already served', () => {
      const redCards = [
        makeRedCard({
          id: 'r1',
          match_id: 'm1',
          player_id: 'p1',
          player_name_string: 'Messi',
          served_in_match_id: 'm2',
        }),
      ];
      const matches = [
        makeMatch({
          id: 'm1',
          home_player_id: 'p1',
          away_player_id: 'p2',
          round_number: 1,
          is_played: true,
        }),
        makeMatch({
          id: 'm3',
          home_player_id: 'p4',
          away_player_id: 'p1',
          round_number: 3,
          is_played: false,
        }),
      ];
      const suspended = getSuspendedPlayers(redCards, matches, 'm3');
      expect(suspended.has('p1')).toBe(false);
    });

    it('should not suspend if the next match is not the target match', () => {
      const redCards = [
        makeRedCard({
          id: 'r1',
          match_id: 'm1',
          player_id: 'p1',
          player_name_string: 'Messi',
          served_in_match_id: null,
        }),
      ];
      const matches = [
        makeMatch({
          id: 'm1',
          home_player_id: 'p1',
          away_player_id: 'p2',
          round_number: 1,
          is_played: true,
        }),
        makeMatch({
          id: 'm2',
          home_player_id: 'p3',
          away_player_id: 'p1',
          round_number: 2,
          is_played: false,
        }),
        makeMatch({
          id: 'm4',
          home_player_id: 'p1',
          away_player_id: 'p4',
          round_number: 3,
          is_played: false,
        }),
      ];
      const suspended = getSuspendedPlayers(redCards, matches, 'm4');
      expect(suspended.has('p1')).toBe(false);
    });
  });

  describe('validateLineup', () => {
    it('should return true for non-suspended player', () => {
      expect(validateLineup('p1', new Set())).toBe(true);
    });

    it('should return false for suspended player', () => {
      expect(validateLineup('p1', new Set(['p1']))).toBe(false);
    });
  });
});
