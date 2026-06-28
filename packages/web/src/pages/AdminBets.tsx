import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

interface AdminBet {
  id: string;
  profile_id: string;
  username: string;
  match_id: string;
  bet_type: string;
  amount: number;
  potential_payout: number;
  status: string;
  created_at: string;
}

interface Player {
  id: string;
  username: string;
  selected_team: string | null;
}

interface Match {
  id: string;
  home_player_id: string;
  away_player_id: string;
  round_number: number;
  stage: string;
  is_played: boolean;
  home_score: number | null;
  away_score: number | null;
}

const BET_LABELS: Record<string, string> = {
  HOME: 'Ev',
  DRAW: 'Beraberlik',
  AWAY: 'Dep',
  UNDER: 'Alt 2.5',
  OVER: 'Üst 2.5',
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'badge-gold',
  WON: 'badge-green',
  LOST: 'badge-red',
  VOID: 'badge-muted',
};

export function AdminBets() {
  const [bets, setBets] = useState<AdminBet[]>([]);
  const [players, setPlayers] = useState<Map<string, string>>(new Map());
  const [matches, setMatches] = useState<Match[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'WON' | 'LOST'>('ALL');
  const [playerFilter, setPlayerFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [betsData, playersData, matchesData] = await Promise.all([
        apiFetch<AdminBet[]>('/api/admin/bets'),
        apiFetch<Player[]>('/api/admin/players'),
        apiFetch<Match[]>('/api/matches'),
      ]);
      setBets(betsData);
      const pmap = new Map<string, string>();
      for (const p of playersData) pmap.set(p.id, p.username);
      setPlayers(pmap);
      setMatches(matchesData);
    } catch {
      // silently fail
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const playerName = (id: string) => players.get(id) || id.slice(0, 8);

  const filteredBets = useMemo(() => {
    let b = bets;
    if (filter !== 'ALL') b = b.filter((x) => x.status === filter);
    if (playerFilter !== 'ALL') b = b.filter((x) => x.profile_id === playerFilter);
    return b;
  }, [bets, filter, playerFilter]);

  // Winnings summary
  const winnings = useMemo(() => {
    const map = new Map<string, { won: number; lost: number; pending: number; net: number }>();
    for (const b of bets) {
      if (!map.has(b.profile_id)) {
        map.set(b.profile_id, { won: 0, lost: 0, pending: 0, net: 0 });
      }
      const w = map.get(b.profile_id)!;
      if (b.status === 'WON') { w.won += b.potential_payout - b.amount; w.net += b.potential_payout - b.amount; }
      else if (b.status === 'LOST') { w.lost += b.amount; w.net -= b.amount; }
      else w.pending += b.amount;
    }
    return Array.from(map.entries())
      .map(([id, w]) => ({ id, username: playerName(id), ...w }))
      .sort((a, b) => b.net - a.net);
  }, [bets, playerName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-chalk-muted/20 border-t-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-display text-3xl tracking-wide text-chalk">Bahis Takip</h1>

      {/* Winnings Summary */}
      {winnings.length > 0 && (
        <div className="card">
          <h2 className="mb-4 font-display text-lg tracking-wide text-chalk">Oyuncu Kazanç/Kayıp</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {winnings.map((w) => (
              <div key={w.id} className="rounded-xl border border-border bg-surface/50 px-4 py-3 text-center">
                <p className="text-sm font-semibold text-chalk">{w.username}</p>
                <div className="mt-2 flex justify-center gap-3 text-xs">
                  <span className="text-grass">+{w.won.toFixed(0)}</span>
                  <span className="text-red-card">-{w.lost.toFixed(0)}</span>
                  {w.pending > 0 && <span className="text-gold">{w.pending.toFixed(0)} VP bekliyor</span>}
                </div>
                <p className={cn('font-mono text-base font-bold mt-1', w.net >= 0 ? 'text-grass' : 'text-red-card')}>
                  {w.net >= 0 ? '+' : ''}{w.net.toFixed(0)} VP
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-surface rounded-lg border border-border p-1">
          {(['ALL', 'PENDING', 'WON', 'LOST'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                filter === f ? 'bg-gold text-black' : 'text-chalk-muted hover:text-chalk',
              )}
            >
              {f === 'ALL' ? 'Tümü' : f === 'PENDING' ? 'Bekleyen' : f === 'WON' ? 'Kazanan' : 'Kaybeden'}
            </button>
          ))}
        </div>
        <select
          value={playerFilter}
          onChange={(e) => setPlayerFilter(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-chalk focus:border-gold focus:outline-none"
        >
          <option value="ALL">Tüm Oyuncular</option>
          {winnings.map((w) => (
            <option key={w.id} value={w.id}>{w.username}</option>
          ))}
        </select>
        <span className="text-xs text-chalk-muted ml-auto">
          {filteredBets.length} bahis
        </span>
      </div>

      {/* Bet Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-chalk-muted text-xs">
              <th className="text-left py-3 px-3 font-medium">Oyuncu</th>
              <th className="text-left py-3 px-3 font-medium">Maç</th>
              <th className="text-center py-3 px-3 font-medium">Seçim</th>
              <th className="text-right py-3 px-3 font-medium">Miktar</th>
              <th className="text-right py-3 px-3 font-medium">Oran</th>
              <th className="text-right py-3 px-3 font-medium">Kazanç</th>
              <th className="text-center py-3 px-3 font-medium">Durum</th>
              <th className="text-right py-3 px-3 font-medium">Tarih</th>
            </tr>
          </thead>
          <tbody>
            {filteredBets.map((b) => {
              const match = matches.find((m) => m.id === b.match_id);
              const matchLabel = match
                ? match.stage === 'LEAGUE'
                  ? `R${match.round_number}: ${playerName(match.home_player_id)} vs ${playerName(match.away_player_id)}`
                  : `Playoff: ${playerName(match.home_player_id)} vs ${playerName(match.away_player_id)}`
                : b.match_id.slice(0, 8);
              const odds = b.amount > 0 ? (b.potential_payout / b.amount).toFixed(2) : '—';

              return (
                <tr
                  key={b.id}
                  className={cn(
                    'border-b border-border/50 transition-colors',
                    b.status === 'WON' ? 'bg-grass/5' : b.status === 'LOST' ? 'bg-red-card/5' : '',
                  )}
                >
                  <td className="py-2.5 px-3 font-medium text-chalk">{b.username}</td>
                  <td className="py-2.5 px-3 text-chalk-muted text-xs max-w-[200px] truncate">{matchLabel}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-gold font-mono text-xs font-bold">
                      {BET_LABELS[b.bet_type] || b.bet_type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-xs text-chalk">{b.amount} VP</td>
                  <td className="py-2.5 px-3 text-right font-mono text-xs text-chalk-muted">{odds}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-xs text-chalk">
                    {b.status === 'WON' ? (
                      <span className="text-grass">+{(b.potential_payout - b.amount).toFixed(0)} VP</span>
                    ) : b.status === 'LOST' ? (
                      <span className="text-red-card">-{b.amount} VP</span>
                    ) : (
                      <span className="text-gold">{b.potential_payout} VP</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={cn('badge text-[10px]', STATUS_STYLE[b.status] || 'badge-muted')}>
                      {b.status === 'WON' ? 'Kazandı' : b.status === 'LOST' ? 'Kaybetti' : b.status === 'VOID' ? 'İade' : 'Bekliyor'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-xs text-chalk-muted/50">
                    {new Date(b.created_at).toLocaleDateString('tr-TR')}
                  </td>
                </tr>
              );
            })}
            {filteredBets.length === 0 && (
              <tr>
                <td colSpan={8} className="py-16 text-center text-chalk-muted">
                  {bets.length === 0 ? 'Henüz hiç bahis yapılmadı.' : 'Bu filtreye uygun bahis yok.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
