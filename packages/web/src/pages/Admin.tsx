import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Player {
  id: string;
  username: string;
  selected_team: string | null;
  is_admin: boolean;
  avatar_url: string | null;
  tournament_status: string;
}

interface Match {
  id: string;
  round_number: number;
  home_player_id: string;
  away_player_id: string;
  is_played: boolean;
  home_score: number | null;
  away_score: number | null;
}

export function Admin() {
  // Score input
  const [matchId, setMatchId] = useState('');
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);

  // Odds input
  const [oddsMatchId, setOddsMatchId] = useState('');
  const [oddsHome, setOddsHome] = useState(2.0);
  const [oddsDraw, setOddsDraw] = useState(3.5);
  const [oddsAway, setOddsAway] = useState(4.0);

  // Tournament management
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [matches, setMatches] = useState<Match[]>([]);
  const [message, setMessage] = useState('');
  const [promoteId, setPromoteId] = useState('');

  const fetchPlayers = useCallback(async () => {
    const data = await apiFetch<Player[]>('/api/admin/players');
    setPlayers(data);
  }, []);

  const fetchMatches = useCallback(async () => {
    const data = await apiFetch<Match[]>('/api/matches');
    setMatches(data);
  }, []);

  useEffect(() => {
    fetchPlayers();
    fetchMatches();
  }, [fetchPlayers, fetchMatches]);

  const togglePlayer = (id: string) => {
    setSelectedPlayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const generateFixtures = async () => {
    if (selectedPlayers.size < 2) {
      setMessage('En az 2 oyuncu seçmelisin');
      return;
    }
    try {
      const result = await apiFetch<{ matches: Match[]; count: number }>(
        '/api/admin/generate-fixtures',
        {
          method: 'POST',
          body: JSON.stringify({ playerIds: Array.from(selectedPlayers) }),
        },
      );
      setMessage(`${result.count} maç oluşturuldu!`);
      fetchMatches();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Hata');
    }
  };

  const generatePlayoffs = async () => {
    try {
      const result = await apiFetch<{
        matches: Match[];
        top4: { username: string; points: number }[];
      }>('/api/admin/generate-playoffs', { method: 'POST' });
      setMessage(`Playoff oluşturuldu! Top 4: ${result.top4.map((p) => p.username).join(', ')}`);
      fetchMatches();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Hata');
    }
  };

  const submitScore = async () => {
    if (!matchId) return;
    try {
      await apiFetch(`/api/admin/matches/${matchId}/score`, {
        method: 'POST',
        body: JSON.stringify({ homeScore, awayScore, redCards: [] }),
      });
      setMessage('Skor kaydedildi!');
      setMatchId('');
      fetchMatches();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Hata');
    }
  };

  const submitForfeit = async () => {
    if (!matchId) return;
    try {
      await apiFetch(`/api/admin/matches/${matchId}/forfeit`, { method: 'POST' });
      setMessage('Hükmen 3-0 işlendi!');
      setMatchId('');
      fetchMatches();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Hata');
    }
  };

  const submitOdds = async () => {
    if (!oddsMatchId) return;
    try {
      await apiFetch('/api/admin/odds', {
        method: 'POST',
        body: JSON.stringify({ matchId: oddsMatchId, oddsHome, oddsDraw, oddsAway }),
      });
      setMessage('Oranlar kaydedildi!');
      setOddsMatchId('');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Hata');
    }
  };

  const promoteAdmin = async () => {
    if (!promoteId) return;
    try {
      await apiFetch('/api/admin/promote-admin', {
        method: 'POST',
        body: JSON.stringify({ profileId: promoteId }),
      });
      setMessage('Admin yetkisi verildi!');
      setPromoteId('');
      fetchPlayers();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Hata');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl tracking-wide text-chalk">Admin Paneli</h1>

      {/* Application Approvals */}
      {players.filter((p) => p.tournament_status === 'PENDING').length > 0 && (
        <div className="card border-gold/30">
          <h2 className="mb-4 font-display text-xl tracking-wide text-gold">
            Bekleyen Başvurular ({players.filter((p) => p.tournament_status === 'PENDING').length})
          </h2>
          <div className="space-y-2">
            {players
              .filter((p) => p.tournament_status === 'PENDING')
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface/50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {p.avatar_url
                        ? (
                            {
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
                            } as Record<string, string>
                          )[p.avatar_url] || '👤'
                        : '👤'}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-chalk">{p.username}</p>
                      <p className="text-xs text-chalk-muted">Başvurdu</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await apiFetch(`/api/admin/applications/${p.id}/approve`, {
                          method: 'POST',
                        });
                        fetchPlayers();
                      }}
                      className="rounded-lg bg-grass/15 px-4 py-2 text-xs font-bold text-grass hover:bg-grass/25 transition-all"
                    >
                      Onayla
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await apiFetch(`/api/admin/applications/${p.id}/reject`, {
                          method: 'POST',
                        });
                        fetchPlayers();
                      }}
                      className="rounded-lg bg-red-card/15 px-4 py-2 text-xs font-bold text-red-card hover:bg-red-card/25 transition-all"
                    >
                      Reddet
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
          {message}
          <button
            type="button"
            onClick={() => setMessage('')}
            className="ml-3 text-neutral-400 hover:text-neutral-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tournament Setup */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="mb-4 text-lg font-semibold">Turnuva Yönetimi</h2>

        {/* Player selection */}
        <div className="mb-6">
          <h3 className="mb-2 text-sm text-neutral-400">
            Oyuncular ({players.length}) — Fikstür için seçin:
          </h3>
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-neutral-800 p-3">
            {players.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-neutral-800"
              >
                <input
                  type="checkbox"
                  checked={selectedPlayers.has(p.id)}
                  onChange={() => togglePlayer(p.id)}
                  className="rounded"
                />
                <span className="text-sm">{p.username}</span>
                {p.selected_team && <span className="text-xs text-accent">{p.selected_team}</span>}
                {p.is_admin && (
                  <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] text-amber-400">
                    ADMIN
                  </span>
                )}
              </label>
            ))}
            {players.length === 0 && (
              <p className="text-sm text-neutral-500">Henüz kayıtlı oyuncu yok</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={generateFixtures}
            disabled={selectedPlayers.size < 2}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
          >
            Fikstür Oluştur ({selectedPlayers.size} oyuncu)
          </button>
          <button
            type="button"
            onClick={generatePlayoffs}
            className="rounded-lg border border-accent px-4 py-2 text-sm font-bold text-accent hover:bg-accent/10"
          >
            Playoff Oluştur
          </button>
        </div>
      </div>

      {/* Match list */}
      {matches.length > 0 && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-4 text-lg font-semibold">Maç Listesi</h2>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {matches.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded border border-neutral-800 px-3 py-2 text-sm"
              >
                <span className="text-neutral-500 w-16">
                  {m.stage === 'LEAGUE' ? `R${m.round_number}` : 'PLAYOFF'}
                </span>
                <span className="flex-1 text-right">{m.home_player_id.slice(0, 8)}</span>
                <span className="mx-3 font-bold tabular-nums">
                  {m.is_played ? `${m.home_score}-${m.away_score}` : 'vs'}
                </span>
                <span className="flex-1">{m.away_player_id.slice(0, 8)}</span>
                <span className="w-20 text-right">
                  {m.is_played ? (
                    <span className="text-green-400">Oynandı</span>
                  ) : (
                    <span className="text-neutral-500">Bekliyor</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMatchId(m.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="ml-2 rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-400 hover:text-neutral-200"
                >
                  Seç
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Score Input */}
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
            <div className="flex gap-2">
              <button
                type="button"
                onClick={submitScore}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-black"
              >
                Skoru Kaydet
              </button>
              <button
                type="button"
                onClick={submitForfeit}
                className="rounded-lg border border-red-800 px-4 py-2 text-sm font-bold text-red-400 hover:bg-red-900/20"
              >
                Hükmen 3-0
              </button>
            </div>
          </div>
        </div>

        {/* Odds Input */}
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

        {/* Promote admin */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-4 text-lg font-semibold">Admin Yetkisi Ver</h2>
          <div className="space-y-3">
            <select
              value={promoteId}
              onChange={(e) => setPromoteId(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100"
            >
              <option value="">Oyuncu seçin...</option>
              {players
                .filter((p) => !p.is_admin)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.username}
                  </option>
                ))}
            </select>
            <button
              type="button"
              onClick={promoteAdmin}
              disabled={!promoteId}
              className="rounded-lg border border-amber-600 px-4 py-2 text-sm font-bold text-amber-400 hover:bg-amber-900/20 disabled:opacity-50"
            >
              Admin Yap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
