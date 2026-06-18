import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useBetSlipStore } from '@/stores/bet-slip';
import { useMatchStore } from '@/stores/matches';

export function Betting() {
  const { matches, fetchMatches } = useMatchStore();
  const { isOpen, betType, amount, potentialPayout, openSlip, closeSlip, setAmount, placeBet } =
    useBetSlipStore();

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const upcoming = matches.filter((m) => !m.is_played);
  const defaultOdds = { HOME: 2.0, DRAW: 3.5, AWAY: 4.0 };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bahis Brokerı</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {upcoming.map((m) => (
          <div key={m.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="font-medium">{m.home_player_id}</span>
              <span className="text-neutral-500">vs</span>
              <span className="font-medium">{m.away_player_id}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['HOME', 'DRAW', 'AWAY'] as const).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => openSlip(m.id, type, defaultOdds[type])}
                  className="rounded-lg border border-neutral-700 bg-neutral-800 py-2 text-center text-sm transition-colors hover:border-accent hover:bg-accent/10"
                >
                  <span className="block text-xs text-neutral-400">
                    {type === 'HOME' ? 'Ev' : type === 'DRAW' ? 'B' : 'Dep'}
                  </span>
                  <span className="font-bold text-accent">{defaultOdds[type].toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-96 border-l border-neutral-800 bg-neutral-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
            <h3 className="text-lg font-bold">Bahis Kuponu</h3>
            <button type="button" onClick={closeSlip}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4 p-6">
            <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
              <p className="text-sm text-neutral-400">Seçim</p>
              <p className="font-semibold">{betType}</p>
            </div>
            <div>
              <span className="text-sm text-neutral-400">VP Miktarı</span>
              <input
                type="number"
                min={1}
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value), defaultOdds[betType || 'HOME'])}
                className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100"
                placeholder="Bahis miktarı"
              />
            </div>
            <div className="rounded-lg bg-accent/10 p-4 text-center">
              <p className="text-sm text-neutral-400">Potansiyel Kazanç</p>
              <p className="text-2xl font-bold text-accent">{potentialPayout} VP</p>
            </div>
            <button
              type="button"
              onClick={placeBet}
              className="w-full rounded-lg bg-accent py-3 font-bold text-black"
            >
              Bahis Yap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
