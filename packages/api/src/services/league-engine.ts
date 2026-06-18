import type { Match, StandingRow } from '../db/schema';

export function generateFixtures(playerIds: string[]): Omit<Match, 'id' | 'created_at'>[] {
  if (playerIds.length < 2) {
    throw new Error('At least 2 players required for fixtures');
  }

  const n = playerIds.length;
  const isOdd = n % 2 !== 0;
  const players = isOdd ? [...playerIds, 'BYE'] : [...playerIds];
  const totalRounds = players.length - 1;
  const matchesPerRound = players.length / 2;
  const fixtures: Omit<Match, 'id' | 'created_at'>[] = [];

  // Circle method for round-robin
  const rotating = players.slice(1);
  // biome-ignore lint/style/noNonNullAssertion: players has at least 2 elements
  const fixed = players[0]!;

  for (let round = 0; round < totalRounds; round++) {
    for (let i = 0; i < matchesPerRound; i++) {
      let home: string;
      let away: string;
      if (i === 0) {
        home = fixed;
        // biome-ignore lint/style/noNonNullAssertion: index within bounds
        away = rotating[round % rotating.length]!;
      } else {
        // biome-ignore lint/style/noNonNullAssertion: index within bounds
        home = rotating[(round + i - 1) % rotating.length]!;
        // biome-ignore lint/style/noNonNullAssertion: index within bounds
        away = rotating[(rotating.length - 1 - i + round) % rotating.length]!;
      }

      if (home === 'BYE' || away === 'BYE') continue;

      fixtures.push({
        stage: 'LEAGUE',
        home_player_id: home,
        away_player_id: away,
        home_score: null,
        away_score: null,
        is_played: false,
        is_forfeit: false,
        match_date: null,
        round_number: round + 1,
        playoff_metadata: null,
      });
    }
  }

  return fixtures;
}

export function calculateStandings(
  matches: Match[],
  playerNames: Record<string, string>,
  playerTeams: Record<string, string>,
): StandingRow[] {
  const stats = new Map<string, StandingRow>();

  const initPlayer = (playerId: string) => {
    if (!stats.has(playerId)) {
      stats.set(playerId, {
        playerId,
        username: playerNames[playerId] || playerId,
        team: playerTeams[playerId] || null,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      });
    }
  };

  for (const m of matches) {
    if (!m.is_played || m.home_score === null || m.away_score === null) continue;
    initPlayer(m.home_player_id);
    initPlayer(m.away_player_id);

    // biome-ignore lint/style/noNonNullAssertion: initPlayer ensures these exist
    const home = stats.get(m.home_player_id)!;
    // biome-ignore lint/style/noNonNullAssertion: initPlayer ensures these exist
    const away = stats.get(m.away_player_id)!;

    home.played++;
    away.played++;
    home.goalsFor += m.home_score;
    home.goalsAgainst += m.away_score;
    away.goalsFor += m.away_score;
    away.goalsAgainst += m.home_score;

    if (m.home_score > m.away_score) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (m.home_score < m.away_score) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }
  }

  for (const row of stats.values()) {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
  }

  return Array.from(stats.values());
}

function getH2HPoints(
  playerIds: string[],
  allMatches: Match[],
): Map<string, { points: number; gd: number; gf: number }> {
  const h2h = new Map<string, { points: number; gd: number; gf: number }>();
  const set = new Set(playerIds);

  for (const id of playerIds) {
    h2h.set(id, { points: 0, gd: 0, gf: 0 });
  }

  for (const m of allMatches) {
    if (!m.is_played || m.home_score === null || m.away_score === null) continue;
    if (!set.has(m.home_player_id) || !set.has(m.away_player_id)) continue;

    // biome-ignore lint/style/noNonNullAssertion: init ensures these keys exist
    const home = h2h.get(m.home_player_id)!;
    // biome-ignore lint/style/noNonNullAssertion: init ensures these keys exist
    const away = h2h.get(m.away_player_id)!;

    home.gf += m.home_score;
    home.gd += m.home_score - m.away_score;
    away.gf += m.away_score;
    away.gd += m.away_score - m.home_score;

    if (m.home_score > m.away_score) home.points += 3;
    else if (m.home_score < m.away_score) away.points += 3;
    else {
      home.points += 1;
      away.points += 1;
    }
  }

  return h2h;
}

export function sortStandings(rows: StandingRow[], allMatches: Match[]): StandingRow[] {
  return [...rows].sort((a, b) => {
    // 1. Points
    if (b.points !== a.points) return b.points - a.points;

    // 2. Goal Difference
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;

    // 3. Goals Scored
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

    // 4. Head-to-Head
    const tied = rows.filter((r) => r.points === a.points);
    if (tied.length <= 1) return 0;

    const h2h = getH2HPoints(
      tied.map((r) => r.playerId),
      allMatches,
    );
    // biome-ignore lint/style/noNonNullAssertion: getH2HPoints returns entries for all playerIds in `tied`
    const aH2H = h2h.get(a.playerId)!;
    // biome-ignore lint/style/noNonNullAssertion: getH2HPoints returns entries for all playerIds in `tied`
    const bH2H = h2h.get(b.playerId)!;

    if (bH2H.points !== aH2H.points) return bH2H.points - aH2H.points;
    if (bH2H.gd !== aH2H.gd) return bH2H.gd - aH2H.gd;
    return bH2H.gf - aH2H.gf;
  });
}
