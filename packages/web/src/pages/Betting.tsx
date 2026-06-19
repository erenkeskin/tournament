import { Coins, History, TrendingUp, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useBetSlipStore } from '@/stores/bet-slip';
import { useMatchStore } from '@/stores/matches';

interface Player {
  id: string;
  username: string;
  selected_team: string | null;
  avatar_url: string | null;
}

interface Bet {
  id: string;
  match_id: string;
  bet_type: string;
  amount: number;
  potential_payout: number;
  status: string;
  created_at: string;
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

const BET_LABELS: Record<string, string> = { HOME: 'Ev', DRAW: 'Beraberlik', AWAY: 'Dep' };
const STATUS_STYLE: Record<string, string> = {
  PENDING: 'badge-gold',
  WON: 'badge-green',
  LOST: 'badge-red',
  VOID: 'badge-muted',
};

export function Betting() {
  const { matches, fetchMatches } = useMatchStore();
  const { isOpen, betType, amount, potentialPayout, openSlip, closeSlip, setAmount, placeBet } =
    useBetSlipStore();
  const [players, setPlayers] = useState<Map<string, Player>>(new Map());
  const [balance, setBalance] = useState<number | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [oddsData, setOddsData] = useState<
    Record<string, { odds_home: number; odds_draw: number; odds_away: number }>
  >({});

  const fetchBalance = useCallback(() => {
    apiFetch<{ balance: number }>('/api/wallet')
      .then((d) => setBalance(d.balance))
      .catch(() => {});
  }, []);

  const fetchBets = useCallback(() => {
    apiFetch<Bet[]>('/api/bets')
      .then(setBets)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchMatches();
    fetchBalance();
    fetchBets();
    apiFetch<Player[]>('/api/players')
      .then((data) => {
        const map = new Map<string, Player>();
        for (const p of data) map.set(p.id, p);
        setPlayers(map);
      })
      .catch(() => {});
    // Fetch real odds
    apiFetch<{ match_id: string; odds_home: number; odds_draw: number; odds_away: number }[]>(
      '/api/matches/odds/all',
    )
      .then((data) => {
        const map: Record<string, { odds_home: number; odds_draw: number; odds_away: number }> = {};
        for (const o of data) map[o.match_id] = o;
        setOddsData(map);
      })
      .catch(() => {});
  }, [fetchMatches, fetchBalance, fetchBets]);

  const upcoming = matches.filter((m) => !m.is_played);
  const defaultOdds = { HOME: 2.0, DRAW: 3.5, AWAY: 4.0 };
  const getPlayer = (id: string) => players.get(id);

  const getOdds = (matchId: string) => {
    const o = oddsData[matchId];
    return o ? { HOME: o.odds_home, DRAW: o.odds_draw, AWAY: o.odds_away } : defaultOdds;
  };

  const handlePlaceBet = async () => {
    await placeBet();
    fetchBalance();
    fetchBets();
    toast.success('Bahis yapıldı!', {
      description: "Maç sonucu açıklandığında VP'niz güncellenecek.",
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-12 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="section-title">Bahis Brokerı</h1>
          <p className="mt-1 text-sm text-chalk-muted">Maçlara iddia oyna, VP kazan</p>
        </div>
        <div className="flex items-center gap-3">
          {/* VP */}
          <div className="card flex items-center gap-3 !py-2 !px-4">
            <Coins className="h-5 w-5 text-gold" />
            <span className="font-mono text-lg font-bold text-gold tabular-nums">
              {balance !== null ? balance.toFixed(0) : '---'}
            </span>
            <span className="text-xs text-chalk-muted">VP</span>
          </div>
          {/* History toggle */}
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className={cn('btn-secondary', showHistory && 'bg-surface-hover border-gold/30')}
          >
            <History className="h-4 w-4" />
            Geçmiş ({bets.length})
          </button>
        </div>
      </div>

      {/* Bet history */}
      {showHistory && (
        <div className="card animate-slide-up">
          <h2 className="font-display text-xl tracking-wide text-chalk mb-4">Bahis Geçmişi</h2>
          {bets.length === 0 ? (
            <p className="text-sm text-chalk-muted text-center py-8">Henüz bahis yapmadın.</p>
          ) : (
            <div className="space-y-2">
              {bets.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface/50 px-4 py-3"
                >
                  <div>
                    <span className="text-sm font-medium text-chalk">
                      {BET_LABELS[b.bet_type] || b.bet_type}
                    </span>
                    <span className="text-xs text-chalk-muted ml-2">
                      {new Date(b.created_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm text-chalk-muted">{b.amount} VP</span>
                    <span className="font-mono text-sm text-chalk-muted">
                      → {b.potential_payout} VP
                    </span>
                    <span
                      className={cn('badge text-[11px]', STATUS_STYLE[b.status] || 'badge-muted')}
                    >
                      {b.status === 'WON'
                        ? 'Kazandı'
                        : b.status === 'LOST'
                          ? 'Kaybetti'
                          : b.status === 'VOID'
                            ? 'İade'
                            : 'Bekliyor'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Match grid */}
      {upcoming.length === 0 ? (
        <div className="card py-16 text-center">
          <TrendingUp className="mx-auto mb-4 h-12 w-12 text-chalk-muted/30" />
          <p className="text-lg text-chalk-muted">Bahis yapılabilecek maç yok.</p>
          <p className="mt-1 text-sm text-chalk-muted/60">
            Admin'in fikstür oluşturması ve oran girmesi gerekiyor.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {upcoming.map((m) => {
            const home = getPlayer(m.home_player_id);
            const away = getPlayer(m.away_player_id);
            const homeAvatar = home?.avatar_url ? AVATARS[home.avatar_url] || '👤' : '👤';
            const awayAvatar = away?.avatar_url ? AVATARS[away.avatar_url] || '👤' : '👤';

            return (
              <div key={m.id} className="card group">
                {/* Players */}
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-3 mb-1">
                    <span className="text-xl">{homeAvatar}</span>
                    <span className="font-semibold text-chalk">
                      {home?.username || m.home_player_id.slice(0, 8)}
                    </span>
                    {home?.selected_team && (
                      <span className="text-xs text-chalk-muted">({home.selected_team})</span>
                    )}
                  </div>
                  <span className="font-display text-sm tracking-widest text-chalk-muted/50">
                    VS
                  </span>
                  <div className="flex items-center justify-center gap-3 mt-1">
                    <span className="text-xl">{awayAvatar}</span>
                    <span className="font-semibold text-chalk">
                      {away?.username || m.away_player_id.slice(0, 8)}
                    </span>
                    {away?.selected_team && (
                      <span className="text-xs text-chalk-muted">({away.selected_team})</span>
                    )}
                  </div>
                </div>

                {/* Odds buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {(['HOME', 'DRAW', 'AWAY'] as const).map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => openSlip(m.id, type, getOdds(m.id)[type])}
                      className="group/btn rounded-xl border border-border bg-surface px-3 py-3 text-center transition-all hover:border-gold/40 hover:bg-gold/5 active:scale-[0.98]"
                    >
                      <span className="block text-[11px] font-medium text-chalk-muted mb-0.5">
                        {BET_LABELS[type]}
                      </span>
                      <span className="block font-mono text-lg font-bold text-gold tabular-nums group-hover/btn:scale-110 transition-transform">
                        {getOdds(m.id)[type].toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bet Slip */}
      {isOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 w-full bg-pitch/60 backdrop-blur-sm animate-fade-in border-0 cursor-default"
            onClick={closeSlip}
            aria-label="Kapat"
          />
          <div className="fixed inset-y-0 right-0 z-50 w-96 animate-slide-right border-l border-border bg-pitch shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <h3 className="font-display text-xl tracking-wide text-chalk">Bahis Kuponu</h3>
              <button
                type="button"
                onClick={closeSlip}
                className="rounded-lg p-2 text-chalk-muted hover:bg-surface hover:text-chalk transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              {/* Selection */}
              <div className="rounded-2xl border border-border bg-surface p-5">
                <p className="text-xs text-chalk-muted mb-3 uppercase tracking-wider">Seçimin</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-gold">
                    {BET_LABELS[betType || 'HOME']}
                  </span>
                  {betType && (
                    <span className="font-mono text-sm text-chalk">
                      {getOdds(useBetSlipStore.getState().matchId || '')[betType || 'HOME'].toFixed(
                        2,
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Amount */}
              <div>
                <span className="block text-xs text-chalk-muted mb-2 uppercase tracking-wider">
                  VP Miktarı
                </span>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={balance || 0}
                    value={amount || ''}
                    onChange={(e) => {
                      const bType = useBetSlipStore.getState().betType;
                      setAmount(
                        Number(e.target.value),
                        getOdds(useBetSlipStore.getState().matchId || '')[bType || 'HOME'],
                      );
                    }}
                    className="input !text-lg !font-mono !py-3 text-center"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-chalk-muted">
                    VP
                  </span>
                </div>
                <p className="mt-1 text-xs text-chalk-muted text-right">
                  Bakiye:{' '}
                  <span className="text-gold font-mono">{balance?.toFixed(0) || '---'} VP</span>
                </p>
              </div>

              {/* Quick amounts */}
              <div className="grid grid-cols-4 gap-2">
                {[10, 50, 100, 500].map((v) => (
                  <button
                    type="button"
                    key={v}
                    disabled={(balance || 0) < v}
                    onClick={() => {
                      const bType = useBetSlipStore.getState().betType;
                      setAmount(
                        v,
                        getOdds(useBetSlipStore.getState().matchId || '')[bType || 'HOME'],
                      );
                    }}
                    className="rounded-lg border border-border bg-surface px-2 py-2 text-xs font-mono text-chalk-muted hover:border-gold/30 hover:text-gold transition-all disabled:opacity-30"
                  >
                    {v}
                  </button>
                ))}
              </div>

              {/* Potential payout */}
              <div className="rounded-2xl bg-gold/10 p-5 text-center">
                <p className="text-xs text-chalk-muted mb-1 uppercase tracking-wider">
                  Potansiyel Kazanç
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Coins className="h-5 w-5 text-gold" />
                  <span className="font-mono text-3xl font-bold text-gold tabular-nums">
                    {potentialPayout}
                  </span>
                  <span className="text-sm text-gold/70">VP</span>
                </div>
              </div>

              {/* Place bet */}
              <button
                type="button"
                onClick={handlePlaceBet}
                disabled={!amount || amount <= 0 || (balance || 0) < amount}
                className="btn-primary w-full !py-4 !text-base disabled:opacity-30"
              >
                <Coins className="h-5 w-5" />
                {amount && amount > 0 ? `${amount} VP Bahis Yap` : 'Bahis Yap'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
