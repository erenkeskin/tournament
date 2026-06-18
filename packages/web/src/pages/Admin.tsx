import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export function Admin() {
  const [matchId, setMatchId] = useState('');
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [oddsMatchId, setOddsMatchId] = useState('');
  const [oddsHome, setOddsHome] = useState(2.0);
  const [oddsDraw, setOddsDraw] = useState(3.5);
  const [oddsAway, setOddsAway] = useState(4.0);

  const submitScore = async () => {
    if (!matchId) return;
    await apiFetch(`/api/admin/matches/${matchId}/score`, {
      method: 'POST',
      body: JSON.stringify({ homeScore, awayScore, redCards: [] }),
    });
    setMatchId('');
  };

  const submitOdds = async () => {
    if (!oddsMatchId) return;
    await apiFetch('/api/admin/odds', {
      method: 'POST',
      body: JSON.stringify({ matchId: oddsMatchId, oddsHome, oddsDraw, oddsAway }),
    });
    setOddsMatchId('');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Kontrol Paneli</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-4 text-lg font-semibold">Skor Girişi</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Match ID"
              value={matchId}
              onChange={(e) => setMatchId(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100"
            />
            <div className="flex gap-3">
              <input
                type="number"
                min={0}
                value={homeScore}
                onChange={(e) => setHomeScore(Number(e.target.value))}
                className="w-20 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100"
              />
              <span className="flex items-center text-neutral-400">—</span>
              <input
                type="number"
                min={0}
                value={awayScore}
                onChange={(e) => setAwayScore(Number(e.target.value))}
                className="w-20 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100"
              />
            </div>
            <button
              type="button"
              onClick={submitScore}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-black"
            >
              Skoru Kaydet
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-4 text-lg font-semibold">Oran Girişi</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Match ID"
              value={oddsMatchId}
              onChange={(e) => setOddsMatchId(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100"
            />
            <div className="flex gap-3">
              <input
                type="number"
                step={0.01}
                value={oddsHome}
                onChange={(e) => setOddsHome(Number(e.target.value))}
                className="w-20 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100"
              />
              <input
                type="number"
                step={0.01}
                value={oddsDraw}
                onChange={(e) => setOddsDraw(Number(e.target.value))}
                className="w-20 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100"
              />
              <input
                type="number"
                step={0.01}
                value={oddsAway}
                onChange={(e) => setOddsAway(Number(e.target.value))}
                className="w-20 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100"
              />
            </div>
            <button
              type="button"
              onClick={submitOdds}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-black"
            >
              Oranları Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
