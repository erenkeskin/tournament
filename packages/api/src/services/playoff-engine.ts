import type { Match, PlayoffMetadata, StandingRow } from '../db/schema';

export interface PlayoffBracket {
  semiFinals: Omit<Match, 'id' | 'created_at'>[];
}

export function generatePlayoffBracket(top4: StandingRow[]): PlayoffBracket {
  if (top4.length !== 4) {
    throw new Error('Playoffs require exactly 4 players');
  }

  return {
    semiFinals: [
      {
        stage: 'PLAYOFF',
        home_player_id: top4[0]?.playerId,
        away_player_id: top4[3]?.playerId,
        home_score: null,
        away_score: null,
        is_played: false,
        is_forfeit: false,
        match_date: null,
        round_number: null,
        playoff_metadata: { round: 'SEMI_1' } as PlayoffMetadata,
      },
      {
        stage: 'PLAYOFF',
        home_player_id: top4[1]?.playerId,
        away_player_id: top4[2]?.playerId,
        home_score: null,
        away_score: null,
        is_played: false,
        is_forfeit: false,
        match_date: null,
        round_number: null,
        playoff_metadata: { round: 'SEMI_2' } as PlayoffMetadata,
      },
    ],
  };
}

export interface PlayoffScoreInput {
  homeScore: number;
  awayScore: number;
  extraTimeHome?: number;
  extraTimeAway?: number;
  penaltiesHome?: number;
  penaltiesAway?: number;
}

export function validatePlayoffResult(input: PlayoffScoreInput): {
  valid: boolean;
  reason?: string;
  winner?: string;
} {
  const { homeScore, awayScore, extraTimeHome, extraTimeAway, penaltiesHome, penaltiesAway } =
    input;

  if (homeScore !== awayScore && extraTimeHome === undefined && extraTimeAway === undefined) {
    return { valid: true, winner: homeScore > awayScore ? 'HOME' : 'AWAY' };
  }

  const hasExtraTime = extraTimeHome !== undefined && extraTimeAway !== undefined;
  const hasPenalties = penaltiesHome !== undefined && penaltiesAway !== undefined;

  if (homeScore === awayScore && !hasExtraTime) {
    return {
      valid: false,
      reason: 'Playoff matches cannot end in a draw. Enter extra time or penalty scores.',
    };
  }

  const etHome = extraTimeHome || 0;
  const etAway = extraTimeAway || 0;
  const totalHome = homeScore + etHome;
  const totalAway = awayScore + etAway;

  if (totalHome !== totalAway) {
    return { valid: true, winner: totalHome > totalAway ? 'HOME' : 'AWAY' };
  }

  if (!hasPenalties) {
    return {
      valid: false,
      reason: 'Match still tied after extra time. Enter penalty shootout scores.',
    };
  }

  if (penaltiesHome === penaltiesAway) {
    return { valid: false, reason: 'Penalty shootout cannot end in a tie.' };
  }

  return { valid: true, winner: (penaltiesHome ?? 0) > (penaltiesAway ?? 0) ? 'HOME' : 'AWAY' };
}
