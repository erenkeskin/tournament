import { ArrowRight, Medal, Target, Timer, Trophy } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRealtime } from '@/hooks/useRealtime';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';
import { useMatchStore } from '@/stores/matches';

const _AVATARS: Record<string, string> = {
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

const MEDAL_COLORS = ['text-gold', 'text-chalk-muted/70', 'text-amber-700'];

export function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
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

  if (profile?.tournament_status === 'PENDING') {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <Trophy className="mb-4 h-16 w-16 text-gold/30" />
        <h1 className="section-title mb-2">Başvurun Bekliyor</h1>
        <p className="text-chalk-muted max-w-md">
          Admin başvurunu onayladığında turnuvaya katılacaksın. Bu arada fikstür ve puan durumunu
          takip edebilirsin.
        </p>
        <button type="button" onClick={() => navigate('/fixtures')} className="btn-secondary mt-6">
          Fikstürü Gör <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Trophy, value: standings.length, label: 'Oyuncu' },
          { icon: Target, value: `${playedCount}/${matches.length}`, label: 'Maç' },
          {
            icon: Timer,
            value: nextMatch ? `R${nextMatch.round_number}` : '—',
            label: 'Sıradaki Round',
          },
        ].map(({ icon: Icon, value, label }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
              <Icon className="h-6 w-6 text-gold" />
            </div>
            <div>
              <p className="font-mono text-2xl font-bold text-chalk">{value}</p>
              <p className="text-xs text-chalk-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Standings */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl tracking-wide text-chalk">Puan Durumu</h2>
          <button type="button" onClick={() => navigate('/tree')} className="btn-ghost text-xs">
            Turnuva Ağacı <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header w-10">#</th>
                <th className="table-header">Oyuncu</th>
                <th className="table-header">Takım</th>
                <th className="table-header text-center">O</th>
                <th className="table-header text-center">G</th>
                <th className="table-header text-center">B</th>
                <th className="table-header text-center">M</th>
                <th className="table-header text-center">AV</th>
                <th className="table-header text-center font-bold">P</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, i) => (
                <tr
                  key={row.playerId}
                  className={cn('transition-colors hover:bg-surface/50', i < 4 && 'bg-gold/3')}
                >
                  <td className="table-cell">
                    {i < 3 ? (
                      <Medal className={cn('h-5 w-5', MEDAL_COLORS[i])} />
                    ) : (
                      <span className="font-mono text-sm text-chalk-muted">{i + 1}</span>
                    )}
                  </td>
                  <td className="table-cell font-medium text-chalk">{row.username}</td>
                  <td className="table-cell text-chalk-muted">{row.team || '—'}</td>
                  <td className="table-cell text-center">{row.played}</td>
                  <td className="table-cell text-center">{row.won}</td>
                  <td className="table-cell text-center">{row.drawn}</td>
                  <td className="table-cell text-center">{row.lost}</td>
                  <td className="table-cell text-center font-mono">
                    {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                  </td>
                  <td className="table-cell text-center font-mono font-bold text-gold">
                    {row.points}
                  </td>
                </tr>
              ))}
              {standings.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-chalk-muted">
                    Henüz maç oynanmadı
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
