import { Target, Timer, Trophy } from 'lucide-react';
import { useEffect } from 'react';
import { useRealtime } from '@/hooks/useRealtime';
import { cn } from '@/lib/utils';
import { useMatchStore } from '@/stores/matches';

export function Dashboard() {
  const { standings, matches, fetchStandings, fetchMatches } = useMatchStore();

  useEffect(() => {
    fetchStandings();
    fetchMatches();
  }, [fetchStandings, fetchMatches]);

  useRealtime('matches', () => {
    fetchStandings();
    fetchMatches();
  });

  const nextMatch = matches.find((m) => !m.is_played);
  const playedCount = matches.filter((m) => m.is_played).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="flex items-center gap-2 text-neutral-400">
            <Trophy className="h-4 w-4 text-accent" />
            <span className="text-sm">Oyuncu</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{standings.length}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="flex items-center gap-2 text-neutral-400">
            <Target className="h-4 w-4 text-accent" />
            <span className="text-sm">Maç</span>
          </div>
          <p className="mt-1 text-2xl font-bold">
            {playedCount}/{matches.length}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="flex items-center gap-2 text-neutral-400">
            <Timer className="h-4 w-4 text-accent" />
            <span className="text-sm">Sonraki Maç</span>
          </div>
          <p className="mt-1 text-2xl font-bold">
            {nextMatch ? `Round ${nextMatch.round_number}` : '—'}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900">
        <div className="border-b border-neutral-800 px-6 py-4">
          <h2 className="text-lg font-bold">Puan Durumu</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-800 text-xs text-neutral-400">
              <th className="py-3 pl-6 text-left">#</th>
              <th className="py-3 text-left">Oyuncu</th>
              <th className="py-3 text-left">Takım</th>
              <th className="py-3 text-center">O</th>
              <th className="py-3 text-center">G</th>
              <th className="py-3 text-center">B</th>
              <th className="py-3 text-center">M</th>
              <th className="py-3 text-center">AG</th>
              <th className="py-3 text-center">YG</th>
              <th className="py-3 text-center">AV</th>
              <th className="py-3 pr-6 text-center font-bold">P</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => (
              <tr
                key={row.playerId}
                className={cn('border-b border-neutral-800/50 text-sm', i < 4 && 'bg-accent/5')}
              >
                <td className="py-3 pl-6">
                  <span
                    className={cn(
                      'inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold',
                      i === 0 && 'bg-amber-400/20 text-amber-400',
                      i === 1 && 'bg-neutral-400/20 text-neutral-400',
                      i === 2 && 'bg-amber-700/20 text-amber-700',
                    )}
                  >
                    {i + 1}
                  </span>
                </td>
                <td className="py-3 font-medium">{row.username}</td>
                <td className="py-3 text-neutral-400">{row.team || '—'}</td>
                <td className="py-3 text-center">{row.played}</td>
                <td className="py-3 text-center">{row.won}</td>
                <td className="py-3 text-center">{row.drawn}</td>
                <td className="py-3 text-center">{row.lost}</td>
                <td className="py-3 text-center">{row.goalsFor}</td>
                <td className="py-3 text-center">{row.goalsAgainst}</td>
                <td className="py-3 text-center">{row.goalDifference}</td>
                <td className="py-3 pr-6 text-center font-bold">{row.points}</td>
              </tr>
            ))}
            {standings.length === 0 && (
              <tr>
                <td colSpan={11} className="py-12 text-center text-neutral-500">
                  Henüz maç oynanmadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
