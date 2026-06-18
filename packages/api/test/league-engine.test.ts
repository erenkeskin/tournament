import { describe, expect, it } from 'vitest';
import type { Match, StandingRow } from '../src/db/schema';
import { calculateStandings, generateFixtures, sortStandings } from '../src/services/league-engine';

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: crypto.randomUUID(),
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
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('league-engine', () => {
  describe('generateFixtures', () => {
    it('should generate N*(N-1)/2 matches for N players', () => {
      const players = ['p1', 'p2', 'p3', 'p4'];
      const matches = generateFixtures(players);
      expect(matches).toHaveLength(6); // 4*3/2 = 6
    });

    it('should assign round_numbers starting from 1', () => {
      const players = ['p1', 'p2', 'p3', 'p4'];
      const matches = generateFixtures(players);
      const rounds = new Set(matches.map((m) => m.round_number));
      expect(rounds.size).toBe(3); // 3 rounds for 4 players
      expect(Math.min(...rounds)).toBe(1);
    });

    it('should make every player play every other exactly once', () => {
      const players = ['p1', 'p2', 'p3', 'p4', 'p5'];
      const matches = generateFixtures(players);
      const pairs = new Set<string>();
      for (const m of matches) {
        const pair = [m.home_player_id, m.away_player_id].sort().join('-');
        pairs.add(pair);
      }
      expect(pairs.size).toBe(10); // 5*4/2 = 10
    });

    it('should handle odd number of players with bye rounds', () => {
      const players = ['p1', 'p2', 'p3'];
      const matches = generateFixtures(players);
      expect(matches).toHaveLength(3);
    });

    it('should throw for less than 2 players', () => {
      expect(() => generateFixtures(['p1'])).toThrow();
      expect(() => generateFixtures([])).toThrow();
    });
  });

  describe('calculateStandings', () => {
    it('should award 3 points for win, 1 for draw, 0 for loss', () => {
      const matches = [
        makeMatch({
          home_player_id: 'A',
          away_player_id: 'B',
          home_score: 2,
          away_score: 1,
          is_played: true,
        }),
        makeMatch({
          home_player_id: 'A',
          away_player_id: 'B',
          home_score: 0,
          away_score: 0,
          is_played: true,
        }),
      ];
      const rows = calculateStandings(
        matches,
        { A: 'PlayerA', B: 'PlayerB' },
        { A: 'BRA', B: 'ARG' },
      );
      // biome-ignore lint/style/noNonNullAssertion: rows will contain A and B
      const a = rows.find((r) => r.playerId === 'A')!;
      expect(a.points).toBe(4); // 3 + 1
    });

    it('should handle forfeit as 3-0 win/loss', () => {
      const matches = [
        makeMatch({
          home_player_id: 'A',
          away_player_id: 'B',
          home_score: 3,
          away_score: 0,
          is_played: true,
          is_forfeit: true,
        }),
      ];
      const rows = calculateStandings(
        matches,
        { A: 'PlayerA', B: 'PlayerB' },
        { A: 'BRA', B: 'ARG' },
      );
      // biome-ignore lint/style/noNonNullAssertion: rows will contain A and B
      const a = rows.find((r) => r.playerId === 'A')!;
      // biome-ignore lint/style/noNonNullAssertion: rows will contain A and B
      const b = rows.find((r) => r.playerId === 'B')!;
      expect(a.points).toBe(3);
      expect(b.points).toBe(0);
      expect(a.goalsFor).toBe(3);
      expect(b.goalsFor).toBe(0);
    });

    it('should skip unplayed matches', () => {
      const matches = [makeMatch({ home_player_id: 'A', away_player_id: 'B', is_played: false })];
      const rows = calculateStandings(
        matches,
        { A: 'PlayerA', B: 'PlayerB' },
        { A: 'BRA', B: 'ARG' },
      );
      expect(rows.every((r) => r.played === 0)).toBe(true);
    });
  });

  describe('sortStandings — tie-breaker order', () => {
    it('should sort by points first', () => {
      const rows: StandingRow[] = [
        {
          playerId: 'A',
          username: 'A',
          team: 'BRA',
          played: 2,
          won: 1,
          drawn: 0,
          lost: 1,
          goalsFor: 5,
          goalsAgainst: 3,
          goalDifference: 2,
          points: 3,
        },
        {
          playerId: 'B',
          username: 'B',
          team: 'ARG',
          played: 2,
          won: 2,
          drawn: 0,
          lost: 0,
          goalsFor: 3,
          goalsAgainst: 1,
          goalDifference: 2,
          points: 6,
        },
      ];
      const sorted = sortStandings(rows, []);
      // biome-ignore lint/style/noNonNullAssertion: rows has at least 1 element
      expect(sorted[0]!.playerId).toBe('B');
    });

    it('should break ties with goal difference', () => {
      const rows: StandingRow[] = [
        {
          playerId: 'A',
          username: 'A',
          team: 'BRA',
          played: 2,
          won: 1,
          drawn: 0,
          lost: 1,
          goalsFor: 5,
          goalsAgainst: 3,
          goalDifference: 2,
          points: 3,
        },
        {
          playerId: 'B',
          username: 'B',
          team: 'ARG',
          played: 2,
          won: 1,
          drawn: 0,
          lost: 1,
          goalsFor: 3,
          goalsAgainst: 3,
          goalDifference: 0,
          points: 3,
        },
      ];
      const sorted = sortStandings(rows, []);
      // biome-ignore lint/style/noNonNullAssertion: rows has at least 1 element
      expect(sorted[0]!.playerId).toBe('A');
    });

    it('should break ties with goals scored when GD equal', () => {
      const rows: StandingRow[] = [
        {
          playerId: 'A',
          username: 'A',
          team: 'BRA',
          played: 2,
          won: 1,
          drawn: 0,
          lost: 1,
          goalsFor: 4,
          goalsAgainst: 2,
          goalDifference: 2,
          points: 3,
        },
        {
          playerId: 'B',
          username: 'B',
          team: 'ARG',
          played: 2,
          won: 1,
          drawn: 0,
          lost: 1,
          goalsFor: 5,
          goalsAgainst: 3,
          goalDifference: 2,
          points: 3,
        },
      ];
      const sorted = sortStandings(rows, []);
      // biome-ignore lint/style/noNonNullAssertion: rows has at least 1 element
      expect(sorted[0]!.playerId).toBe('B'); // more goals scored
    });

    it('should break ties with head-to-head record', () => {
      // A beat B, same points, same GD, same GS → A should rank higher
      const rows: StandingRow[] = [
        {
          playerId: 'A',
          username: 'A',
          team: 'BRA',
          played: 2,
          won: 1,
          drawn: 0,
          lost: 1,
          goalsFor: 4,
          goalsAgainst: 2,
          goalDifference: 2,
          points: 3,
        },
        {
          playerId: 'B',
          username: 'B',
          team: 'ARG',
          played: 2,
          won: 1,
          drawn: 0,
          lost: 1,
          goalsFor: 4,
          goalsAgainst: 2,
          goalDifference: 2,
          points: 3,
        },
      ];
      const h2hMatches = [
        makeMatch({
          home_player_id: 'A',
          away_player_id: 'B',
          home_score: 2,
          away_score: 1,
          is_played: true,
        }),
      ];
      const sorted = sortStandings(rows, h2hMatches);
      // biome-ignore lint/style/noNonNullAssertion: rows has at least 1 element
      expect(sorted[0]!.playerId).toBe('A');
    });

    it('should handle three-way tie with H2H mini-league', () => {
      const rows: StandingRow[] = [
        {
          playerId: 'A',
          username: 'A',
          team: 'BRA',
          played: 2,
          won: 1,
          drawn: 0,
          lost: 1,
          goalsFor: 3,
          goalsAgainst: 3,
          goalDifference: 0,
          points: 3,
        },
        {
          playerId: 'B',
          username: 'B',
          team: 'ARG',
          played: 2,
          won: 1,
          drawn: 0,
          lost: 1,
          goalsFor: 3,
          goalsAgainst: 3,
          goalDifference: 0,
          points: 3,
        },
        {
          playerId: 'C',
          username: 'C',
          team: 'FRA',
          played: 2,
          won: 1,
          drawn: 0,
          lost: 1,
          goalsFor: 3,
          goalsAgainst: 3,
          goalDifference: 0,
          points: 3,
        },
      ];
      // A beat B 2-0, B beat C 2-1, C beat A 2-1
      const h2hMatches = [
        makeMatch({
          home_player_id: 'A',
          away_player_id: 'B',
          home_score: 2,
          away_score: 0,
          is_played: true,
        }),
        makeMatch({
          home_player_id: 'B',
          away_player_id: 'C',
          home_score: 2,
          away_score: 1,
          is_played: true,
        }),
        makeMatch({
          home_player_id: 'C',
          away_player_id: 'A',
          home_score: 2,
          away_score: 1,
          is_played: true,
        }),
      ];
      const sorted = sortStandings(rows, h2hMatches);
      // A: GD+2, B: GD0, C: GD0 → A first; then B beat C → B second
      // biome-ignore lint/style/noNonNullAssertion: rows has at least 1 element
      expect(sorted[0]!.playerId).toBe('A');
    });
  });
});
