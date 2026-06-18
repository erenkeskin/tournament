export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  selected_team: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Wallet {
  id: string;
  profile_id: string;
  balance: number;
  updated_at: string;
}

export type MatchStage = 'LEAGUE' | 'PLAYOFF';

export interface Match {
  id: string;
  stage: MatchStage;
  home_player_id: string;
  away_player_id: string;
  home_score: number | null;
  away_score: number | null;
  is_played: boolean;
  is_forfeit: boolean;
  match_date: string | null;
  round_number: number | null;
  playoff_metadata: PlayoffMetadata | null;
  created_at: string;
}

export interface PlayoffMetadata {
  extra_time_home?: number;
  extra_time_away?: number;
  penalties_home?: number;
  penalties_away?: number;
}

export interface RedCard {
  id: string;
  match_id: string;
  player_id: string;
  player_name_string: string;
  served_in_match_id: string | null;
}

export interface Odds {
  id: string;
  match_id: string;
  odds_home: number;
  odds_draw: number;
  odds_away: number;
  updated_at: string;
}

export type BetType = 'HOME' | 'DRAW' | 'AWAY';
export type BetStatus = 'PENDING' | 'WON' | 'LOST' | 'VOID';

export interface Bet {
  id: string;
  profile_id: string;
  match_id: string;
  bet_type: BetType;
  amount: number;
  potential_payout: number;
  status: BetStatus;
  created_at: string;
}

export type TransactionType = 'INITIAL_BONUS' | 'BET_PLACE' | 'BET_WIN' | 'ADMIN_ADJUST';

export interface TransactionLog {
  id: string;
  wallet_id: string;
  amount: number;
  type: TransactionType;
  reference_id: string | null;
  created_at: string;
}

// Standing row for league table
export interface StandingRow {
  playerId: string;
  username: string;
  team: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}
