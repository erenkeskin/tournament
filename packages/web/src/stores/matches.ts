import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

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

export interface Match {
  id: string;
  stage: string;
  home_player_id: string;
  away_player_id: string;
  home_score: number | null;
  away_score: number | null;
  is_played: boolean;
  is_forfeit: boolean;
  round_number: number | null;
  playoff_metadata: unknown;
}

interface MatchState {
  standings: StandingRow[];
  matches: Match[];
  loading: boolean;
  fetchStandings: () => Promise<void>;
  fetchMatches: () => Promise<void>;
}

export const useMatchStore = create<MatchState>((set) => ({
  standings: [],
  matches: [],
  loading: false,
  fetchStandings: async () => {
    set({ loading: true });
    const data = await apiFetch<StandingRow[]>('/api/standings');
    set({ standings: data, loading: false });
  },
  fetchMatches: async () => {
    const data = await apiFetch<Match[]>('/api/matches');
    set({ matches: data });
  },
}));
