import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { type Match, useMatchStore } from '@/stores/matches';

function MatchCard({ match }: { match: Match }) {
  const isDraw = match.is_played && match.home_score === match.away_score;
  const homeWin = match.is_played && (match.home_score || 0) > (match.away_score || 0);

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 text-right">
          <p className={cn('font-semibold', homeWin && 'text-accent')}>{match.home_player_id}</p>
        </div>
        <div className="mx-6 flex flex-col items-center">
          {match.is_played ? (
            <span className="text-xl font-bold tabular-nums">
              {match.home_score} - {match.away_score}
            </span>
          ) : (
            <span className="text-sm text-neutral-500">vs</span>
          )}
          {match.is_forfeit && (
            <span className="mt-1 rounded bg-red-900/50 px-2 py-0.5 text-[10px] text-red-400">
              HÜKMEN
            </span>
          )}
        </div>
        <div className="flex-1">
          <p
            className={cn('font-semibold', !homeWin && match.is_played && !isDraw && 'text-accent')}
          >
            {match.away_player_id}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Fixtures() {
  const { matches, fetchMatches } = useMatchStore();
  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const rounds = useMemo(() => {
    const map = new Map<number, Match[]>();
    for (const m of matches) {
      const round = m.round_number || 0;
      if (!map.has(round)) map.set(round, []);
      map.get(round)?.push(m);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [matches]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Fikstür & Sonuçlar</h1>
      {rounds.map(([round, roundMatches]) => (
        <details key={round} className="group rounded-xl border border-neutral-800 bg-neutral-900">
          <summary className="flex cursor-pointer items-center justify-between px-6 py-4">
            <h2 className="text-lg font-semibold">Round {round}</h2>
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
          </summary>
          <div className="space-y-3 px-6 pb-4">
            {roundMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
