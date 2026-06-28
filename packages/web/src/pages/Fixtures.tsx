import { ChevronDown, Flag, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { type Match, useMatchStore } from '@/stores/matches';

interface Player {
  id: string;
  username: string;
  selected_team: string | null;
  avatar_url: string | null;
}

const AVATARS: Record<string, string> = {
  lion: '🦁',
  eagle: '🦅',
  wolf: '🐺',
  dragon: '🐉',
  shark: '🦈',
  tiger: '🐯',
  bull: '🐂',
  falcon: '🦅',
  panther: '🐆',
  gorilla: '🦍',
  cobra: '🐍',
  rhino: '🦏',
};

function MatchCard({ match, players }: { match: Match; players: Map<string, Player> }) {
  const home = players.get(match.home_player_id);
  const away = players.get(match.away_player_id);
  const homeScore = match.home_score ?? 0;
  const awayScore = match.away_score ?? 0;
  const homeWin = match.is_played && homeScore > awayScore;
  const awayWin = match.is_played && awayScore > homeScore;
  const _isDraw = match.is_played && homeScore === awayScore;
  const homeAvatar = home?.avatar_url ? AVATARS[home.avatar_url] || '👤' : '👤';
  const awayAvatar = away?.avatar_url ? AVATARS[away.avatar_url] || '👤' : '👤';

  return (
    <div
      className={cn(
        'group rounded-2xl border p-5 transition-all duration-300 hover:border-border-light',
        match.is_played ? 'bg-surface/30 border-border/50' : 'bg-surface border-border',
      )}
    >
      {/* Status badge */}
      <div className="mb-3 flex items-center justify-between">
        <span
          className={cn(
            'badge text-[11px]',
            match.is_played ? (match.is_forfeit ? 'badge-red' : 'badge-green') : 'badge-muted',
          )}
        >
          {match.is_forfeit ? 'Hükmen' : match.is_played ? 'Tamamlandı' : 'Bekliyor'}
        </span>
        {match.stage === 'PLAYOFF' && (
          <span className="badge badge-gold text-[11px]">
            <Trophy className="h-3 w-3" /> Playoff
          </span>
        )}
      </div>

      {/* Players row */}
      <div className="flex items-center gap-4">
        {/* Home */}
        <div className="flex flex-1 items-center gap-3 justify-end min-w-0">
          <div className="text-right min-w-0">
            <p
              className={cn(
                'truncate text-sm font-semibold transition-colors',
                homeWin ? 'text-gold' : 'text-chalk',
              )}
            >
              {home?.username || match.home_player_id.slice(0, 8)}
            </p>
            {home?.selected_team && (
              <p className="text-xs text-chalk-muted truncate">{home.selected_team}</p>
            )}
          </div>
          <span className="text-xl flex-shrink-0">{homeAvatar}</span>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center flex-shrink-0 min-w-[80px]">
          {match.is_played ? (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'font-mono text-2xl font-bold tabular-nums',
                  homeWin ? 'text-gold' : 'text-chalk',
                )}
              >
                {homeScore}
              </span>
              <span className="font-mono text-lg text-chalk-muted/40">—</span>
              <span
                className={cn(
                  'font-mono text-2xl font-bold tabular-nums',
                  awayWin ? 'text-gold' : 'text-chalk',
                )}
              >
                {awayScore}
              </span>
            </div>
          ) : (
            <span className="font-display text-sm tracking-widest text-chalk-muted/50">VS</span>
          )}
        </div>

        {/* Away */}
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <span className="text-xl flex-shrink-0">{awayAvatar}</span>
          <div className="min-w-0">
            <p
              className={cn(
                'truncate text-sm font-semibold transition-colors',
                awayWin ? 'text-gold' : 'text-chalk',
              )}
            >
              {away?.username || match.away_player_id.slice(0, 8)}
            </p>
            {away?.selected_team && (
              <p className="text-xs text-chalk-muted truncate">{away.selected_team}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Fixtures() {
  const { matches, fetchMatches } = useMatchStore();
  const [players, setPlayers] = useState<Map<string, Player>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  useEffect(() => {
    apiFetch<Player[]>('/api/players')
      .then((data) => {
        const map = new Map<string, Player>();
        for (const p of data) map.set(p.id, p);
        setPlayers(map);
      })
      .catch((err) => {
        console.error('Failed to fetch players:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const rounds = useMemo(() => {
    const map = new Map<number, Match[]>();
    for (const m of matches) {
      const round = m.round_number || 0;
      if (!map.has(round)) map.set(round, []);
      map.get(round)?.push(m);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [matches]);

  // Separate league and playoff matches
  const leagueRounds = rounds.filter(([, ms]) => ms.some((m) => m.stage === 'LEAGUE'));
  const playoffMatches = matches.filter((m) => m.stage === 'PLAYOFF');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-chalk-muted/20 border-t-gold" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-12 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <Flag className="mx-auto mb-3 h-8 w-8 text-gold" />
        <h1 className="section-title">Fikstür & Sonuçlar</h1>
        <p className="mt-2 text-sm text-chalk-muted">
          {matches.length} maç · {leagueRounds.length} round · {playoffMatches.length} playoff
        </p>
      </div>

      {/* League rounds */}
      {leagueRounds.map(([round, roundMatches]) => (
        <details key={round} className="card group cursor-pointer" open={round === 1}>
          <summary className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 font-mono text-sm font-bold text-gold">
                {round}
              </span>
              <h2 className="font-display text-xl tracking-wide text-chalk">Round {round}</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-chalk-muted">
                {roundMatches.filter((m) => m.is_played).length}/{roundMatches.length} oynandı
              </span>
              <ChevronDown className="h-5 w-5 text-chalk-muted transition-transform group-open:rotate-180" />
            </div>
          </summary>
          <div className="mt-5 space-y-3">
            {roundMatches.map((m) => (
              <MatchCard key={m.id} match={m} players={players} />
            ))}
          </div>
        </details>
      ))}

      {/* Playoff matches */}
      {playoffMatches.length > 0 && (
        <div className="card">
          <div className="mb-4 flex items-center gap-3">
            <Trophy className="h-5 w-5 text-gold" />
            <h2 className="font-display text-xl tracking-wide text-chalk">Playoff</h2>
          </div>
          <div className="space-y-3">
            {playoffMatches.map((m) => (
              <MatchCard key={m.id} match={m} players={players} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {matches.length === 0 && (
        <div className="card py-16 text-center">
          <Flag className="mx-auto mb-4 h-12 w-12 text-chalk-muted/30" />
          <p className="text-lg text-chalk-muted">Henüz fikstür oluşturulmadı.</p>
          <p className="mt-1 text-sm text-chalk-muted/60">
            Admin turnuvayı başlattığında maçlar burada görünecek.
          </p>
        </div>
      )}
    </div>
  );
}
