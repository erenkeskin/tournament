import { ArrowRight, Coins, Dices, Medal, Target, Timer, Trophy } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRealtime } from '@/hooks/useRealtime';
import { apiFetch } from '@/lib/api';
import { getFlag } from '@/lib/flags';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';
import { useMatchStore } from '@/stores/matches';

const MEDAL_COLORS = ['text-gold', 'text-chalk-muted/70', 'text-amber-700'];

export function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { standings, matches, fetchStandings, fetchMatches } = useMatchStore();
  const [balance, setBalance] = useState<number | null>(null);

  const fetchBalance = useCallback(() => {
    if (!profile) return;
    apiFetch<{ balance: number }>('/api/wallet')
      .then((d) => setBalance(d.balance))
      .catch(() => setBalance(null));
  }, [profile]);

  useEffect(() => {
    fetchStandings();
    fetchMatches();
  }, [fetchStandings, fetchMatches]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);
  useRealtime('matches', () => {
    fetchStandings();
    fetchMatches();
  });
  useRealtime('wallets', () => {
    fetchBalance();
  });

  const nextMatch = matches.find((m) => !m.is_played);
  const playedCount = matches.filter((m) => m.is_played).length;
  const isPending = profile?.tournament_status === 'PENDING';
  const isBankrupt = balance !== null && balance <= 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-12 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-chalk-muted mb-1">Hoş geldin</p>
          <h1 className="section-title">{profile?.username || 'Oyuncu'}</h1>
          {profile?.selected_team && (
            <p className="mt-1 text-gold font-medium">{profile.selected_team}</p>
          )}
        </div>

        {/* VP Wallet Card */}
        {balance !== null && (
          <div
            className={cn(
              'card flex items-center gap-4 min-w-[180px]',
              isBankrupt && 'border-red-card/30',
            )}
          >
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl',
                isBankrupt ? 'bg-red-card/15' : 'bg-gold/10',
              )}
            >
              <Coins className={cn('h-6 w-6', isBankrupt ? 'text-red-card' : 'text-gold')} />
            </div>
            <div>
              <p className="text-xs text-chalk-muted">VP Bakiye</p>
              <p
                className={cn(
                  'font-mono text-2xl font-bold tabular-nums',
                  isBankrupt ? 'text-red-card' : 'text-gold',
                )}
              >
                {balance.toFixed(0)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pending banner */}
      {isPending && (
        <div className="card border-gold/30 bg-gold/5 flex items-center gap-4">
          <Trophy className="h-8 w-8 text-gold flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-gold">Başvurun admin onayı bekliyor</p>
            <p className="text-sm text-chalk-muted">
              Onaylanınca turnuvaya katılacaksın. Bu arada fikstür ve iddia takibi yapabilirsin.
            </p>
          </div>
        </div>
      )}

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

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => navigate('/betting')}
          className="card-hover flex items-center gap-4 text-left"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-grass/15">
            <Dices className="h-6 w-6 text-grass" />
          </div>
          <div>
            <p className="font-semibold text-chalk">Bahis Yap</p>
            <p className="text-xs text-chalk-muted">VP'n ile maçlara iddia oyna</p>
          </div>
          <ArrowRight className="h-5 w-5 text-chalk-muted ml-auto" />
        </button>

        <button
          type="button"
          onClick={() => navigate('/fixtures')}
          className="card-hover flex items-center gap-4 text-left"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
            <Target className="h-6 w-6 text-gold" />
          </div>
          <div>
            <p className="font-semibold text-chalk">Fikstür</p>
            <p className="text-xs text-chalk-muted">Maç programını ve sonuçları gör</p>
          </div>
          <ArrowRight className="h-5 w-5 text-chalk-muted ml-auto" />
        </button>
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
              {standings.map((row, i) => {
                const isMe = row.playerId === profile?.id;
                return (
                  <tr
                    key={row.playerId}
                    className={cn(
                      'transition-colors hover:bg-surface/50',
                      isMe && 'bg-gold/5 border-l-2 border-l-gold',
                      i < 4 && !isMe && 'bg-gold/3',
                    )}
                  >
                    <td className="table-cell">
                      {i < 3 ? (
                        <Medal className={cn('h-5 w-5', MEDAL_COLORS[i])} />
                      ) : (
                        <span className="font-mono text-sm text-chalk-muted">{i + 1}</span>
                      )}
                    </td>
                    <td className={cn('table-cell font-medium', isMe ? 'text-gold' : 'text-chalk')}>
                      {row.username}{' '}
                      {isMe && <span className="text-xs text-chalk-muted">(sen)</span>}
                    </td>
                    <td className="table-cell text-chalk-muted">
                      {getFlag(row.team)} {row.team || '—'}
                    </td>
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
                );
              })}
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
