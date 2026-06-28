import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
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
  stage: string;
  round_number: number;
  home_player_id: string;
  away_player_id: string;
  is_played: boolean;
  home_score: number | null;
  away_score: number | null;
}

interface RedCardInput {
  playerId: string;
  playerName: string;
}

export function Admin() {
  // Score input
  const [matchId, setMatchId] = useState('');
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [redCards, setRedCards] = useState<RedCardInput[]>([]);
  const [redName, setRedName] = useState('');

  // Odds input
  const [oddsMatchId, setOddsMatchId] = useState('');
  const [oddsHome, setOddsHome] = useState(2.0);
  const [oddsDraw, setOddsDraw] = useState(3.5);
  const [oddsAway, setOddsAway] = useState(4.0);
  const [oddsUnder, setOddsUnder] = useState(1.85);
  const [oddsOver, setOddsOver] = useState(1.95);

  // Tournament management
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [matches, setMatches] = useState<Match[]>([]);
  const [message, setMessage] = useState('');
  const [promoteId, setPromoteId] = useState('');

  const playerMap = new Map(players.map((p) => [p.id, p]));
  const playerName = (id: string) => playerMap.get(id)?.username || id.slice(0, 8);
  const playerTeam = (id: string) => playerMap.get(id)?.selected_team || null;

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
        body: JSON.stringify({
          homeScore,
          awayScore,
          redCards: redCards.map((rc) => ({ playerId: rc.playerId, playerName: rc.playerName })),
        }),
      });
      setMessage('Skor kaydedildi!');
      toast.success('Skor kaydedildi', { description: 'Maç sonucu ve bahisler güncellendi.' });
      setMatchId('');
      setRedCards([]);
      setRedName('');
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
        body: JSON.stringify({
          matchId: oddsMatchId,
          oddsHome,
          oddsDraw,
          oddsAway,
          oddsUnder,
          oddsOver,
        }),
      });
      toast.success('Oranlar kaydedildi', {
        description: `${playerName(oddsMatchId)} maçı için oranlar güncellendi.`,
      });
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

  const addRedCard = () => {
    if (!redName.trim()) return;
    setRedCards((prev) => [...prev, { playerId: '', playerName: redName.trim() }]);
    setRedName('');
  };

  const removeRedCard = (idx: number) => {
    setRedCards((prev) => prev.filter((_, i) => i !== idx));
  };

  const AVATARS: Record<string, string> = {
    lion: '🦁', eagle: '🦅', wolf: '🐺', dragon: '🐉', shark: '🦈', tiger: '🐯',
    bull: '🐂', falcon: '🦅', panther: '🐆', gorilla: '🦍', cobra: '🐍', rhino: '🦏',
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
                      {(p.avatar_url && AVATARS[p.avatar_url]) || '👤'}
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
                        await apiFetch(`/api/admin/applications/${p.id}/approve`, { method: 'POST' });
                        fetchPlayers();
                      }}
                      className="rounded-lg bg-grass/15 px-4 py-2 text-xs font-bold text-grass hover:bg-grass/25 transition-all"
                    >
                      Onayla
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await apiFetch(`/api/admin/applications/${p.id}/reject`, { method: 'POST' });
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
        <div className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-chalk">
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
      <div className="card">
        <h2 className="mb-4 font-display text-xl tracking-wide text-chalk">Turnuva Yönetimi</h2>

        <div className="mb-6">
          <h3 className="mb-2 text-sm text-chalk-muted">
            Oyuncular ({players.length}) — Fikstür için seçin:
          </h3>
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border p-3">
            {players.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedPlayers.has(p.id)}
                  onChange={() => togglePlayer(p.id)}
                  className="rounded accent-gold"
                />
                <span className="text-sm text-chalk">{p.username}</span>
                {p.selected_team && (
                  <span className="text-xs text-gold">({p.selected_team})</span>
                )}
                {p.is_admin && (
                  <span className="rounded bg-gold/20 px-1.5 py-0.5 text-[10px] text-gold font-medium">
                    ADMIN
                  </span>
                )}
              </label>
            ))}
            {players.length === 0 && (
              <p className="text-sm text-chalk-muted">Henüz kayıtlı oyuncu yok</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={generateFixtures}
            disabled={selectedPlayers.size < 2}
            className="rounded-lg bg-gold px-4 py-2.5 text-sm font-bold text-black hover:bg-gold/90 disabled:opacity-40 transition-all"
          >
            ⚽ Fikstür Oluştur ({selectedPlayers.size} oyuncu)
          </button>
          <button
            type="button"
            onClick={generatePlayoffs}
            className="rounded-lg border border-gold px-4 py-2.5 text-sm font-bold text-gold hover:bg-gold/10 transition-all"
          >
            🏆 Playoff Oluştur
          </button>
        </div>
      </div>

      {/* Match list */}
      {matches.length > 0 && (
        <div className="card">
          <h2 className="mb-4 font-display text-xl tracking-wide text-chalk">Maç Listesi</h2>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {matches.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface/50 transition-colors"
              >
                <span className="text-chalk-muted w-16 font-mono text-xs">
                  {m.stage === 'LEAGUE' ? `R${m.round_number}` : 'PO'}
                </span>
                <span className="flex-1 text-right text-chalk font-medium">
                  {playerName(m.home_player_id)}
                </span>
                <span className="mx-4 font-mono font-bold tabular-nums text-gold">
                  {m.is_played ? `${m.home_score} - ${m.away_score}` : 'vs'}
                </span>
                <span className="flex-1 text-chalk font-medium">
                  {playerName(m.away_player_id)}
                </span>
                <span className="w-20 text-right">
                  {m.is_played ? (
                    <span className="text-grass text-xs">✓ Oynandı</span>
                  ) : (
                    <span className="text-chalk-muted text-xs">Bekliyor</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMatchId(m.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="ml-3 rounded-lg bg-surface px-3 py-1.5 text-xs text-chalk-muted hover:text-chalk hover:bg-border-light transition-all"
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
        <div className="card">
          <h2 className="mb-4 font-display text-xl tracking-wide text-chalk">Skor Girişi</h2>
          <div className="space-y-4">
            <select
              value={matchId}
              onChange={(e) => setMatchId(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-chalk focus:border-gold focus:outline-none"
            >
              <option value="">Maç seç...</option>
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.stage === 'LEAGUE' ? `R${m.round_number}` : 'Playoff'} —{' '}
                  {playerName(m.home_player_id)} vs {playerName(m.away_player_id)}
                  {m.is_played ? ' ✓' : ''}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-4">
              <div className="flex-1 text-right">
                <p className="text-xs text-chalk-muted mb-1">Ev Sahibi</p>
                <p className="text-sm font-semibold text-chalk">
                  {matchId ? playerName(players.find((p) => p.id === matches.find((m) => m.id === matchId)?.home_player_id)?.id || '') : '-'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={homeScore}
                  onChange={(e) => setHomeScore(Number(e.target.value))}
                  className="w-16 rounded-lg border border-border bg-surface px-3 py-2 text-center text-sm text-chalk focus:border-gold focus:outline-none"
                />
                <span className="text-chalk-muted font-bold">—</span>
                <input
                  type="number"
                  min={0}
                  value={awayScore}
                  onChange={(e) => setAwayScore(Number(e.target.value))}
                  className="w-16 rounded-lg border border-border bg-surface px-3 py-2 text-center text-sm text-chalk focus:border-gold focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <p className="text-xs text-chalk-muted mb-1">Deplasman</p>
                <p className="text-sm font-semibold text-chalk">
                  {matchId ? playerName(players.find((p) => p.id === matches.find((m) => m.id === matchId)?.away_player_id)?.id || '') : '-'}
                </p>
              </div>
            </div>

            {/* Red Cards */}
            <div className="rounded-lg border border-red-card/20 bg-red-card/5 p-3 space-y-2">
              <p className="text-xs font-semibold text-red-card flex items-center gap-1">
                🟥 Kırmızı Kartlar
              </p>
              {redCards.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {redCards.map((rc, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full bg-red-card/20 px-3 py-1 text-xs text-red-card"
                    >
                      {rc.playerName}
                      <button
                        type="button"
                        onClick={() => removeRedCard(i)}
                        className="ml-1 hover:text-red-300"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Futbolcu adı..."
                  value={redName}
                  onChange={(e) => setRedName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addRedCard()}
                  className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-chalk focus:border-red-card focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addRedCard}
                  className="rounded-lg bg-red-card/20 px-3 py-1.5 text-xs font-bold text-red-card hover:bg-red-card/30 transition-all"
                >
                  Ekle
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={submitScore}
                disabled={!matchId}
                className="rounded-lg bg-grass px-4 py-2.5 text-sm font-bold text-white hover:bg-grass/90 disabled:opacity-40 transition-all"
              >
                ✓ Skoru Kaydet
              </button>
              <button
                type="button"
                onClick={submitForfeit}
                disabled={!matchId}
                className="rounded-lg border border-red-card px-4 py-2.5 text-sm font-bold text-red-card hover:bg-red-card/10 disabled:opacity-40 transition-all"
              >
                🚫 Hükmen 3-0
              </button>
            </div>
          </div>
        </div>

        {/* Odds Input */}
        <div className="card">
          <h2 className="mb-4 font-display text-xl tracking-wide text-chalk">Oran Girişi</h2>
          <div className="space-y-4">
            <select
              value={oddsMatchId}
              onChange={(e) => setOddsMatchId(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-chalk focus:border-gold focus:outline-none"
            >
              <option value="">Maç seç...</option>
              {matches
                .filter((m) => !m.is_played)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.stage === 'LEAGUE' ? `R${m.round_number}` : 'Playoff'} —{' '}
                    {playerName(m.home_player_id)} vs {playerName(m.away_player_id)}
                  </option>
                ))}
            </select>

            {/* 1X2 odds */}
            <div>
              <p className="text-xs text-chalk-muted mb-2 font-semibold">Maç Sonucu (1-X-2)</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-chalk-muted block mb-0.5">Ev Sahibi (1)</label>
                  <input
                    type="number"
                    step={0.01}
                    min={1.01}
                    value={oddsHome}
                    onChange={(e) => setOddsHome(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-chalk focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-chalk-muted block mb-0.5">Beraberlik (X)</label>
                  <input
                    type="number"
                    step={0.01}
                    min={1.01}
                    value={oddsDraw}
                    onChange={(e) => setOddsDraw(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-chalk focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-chalk-muted block mb-0.5">Deplasman (2)</label>
                  <input
                    type="number"
                    step={0.01}
                    min={1.01}
                    value={oddsAway}
                    onChange={(e) => setOddsAway(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-chalk focus:border-gold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Over/Under odds */}
            <div>
              <p className="text-xs text-chalk-muted mb-2 font-semibold">Gol Sayısı (Alt/Üst 2.5)</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-chalk-muted block mb-0.5">Alt 2.5</label>
                  <input
                    type="number"
                    step={0.01}
                    min={1.01}
                    value={oddsUnder}
                    onChange={(e) => setOddsUnder(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-chalk focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-chalk-muted block mb-0.5">Üst 2.5</label>
                  <input
                    type="number"
                    step={0.01}
                    min={1.01}
                    value={oddsOver}
                    onChange={(e) => setOddsOver(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-chalk focus:border-gold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={submitOdds}
              disabled={!oddsMatchId}
              className="w-full rounded-lg bg-gold px-4 py-2.5 text-sm font-bold text-black hover:bg-gold/90 disabled:opacity-40 transition-all"
            >
              💰 Oranları Kaydet
            </button>
          </div>
        </div>

        {/* Promote admin */}
        <div className="card">
          <h2 className="mb-4 font-display text-xl tracking-wide text-chalk">Admin Yetkisi Ver</h2>
          <div className="space-y-3">
            <select
              value={promoteId}
              onChange={(e) => setPromoteId(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-chalk focus:border-gold focus:outline-none"
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
              className="w-full rounded-lg border border-gold px-4 py-2.5 text-sm font-bold text-gold hover:bg-gold/10 disabled:opacity-40 transition-all"
            >
              ⭐ Admin Yap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
