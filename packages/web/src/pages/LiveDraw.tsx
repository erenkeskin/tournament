import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Player {
  id: string;
  username: string;
  selected_team: string | null;
}

export function LiveDraw() {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ nation: string; profileId: string } | null>(null);
  const [availableNations, setAvailableNations] = useState<string[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');

  useEffect(() => {
    apiFetch<Player[]>('/api/admin/players')
      .then(setPlayers)
      .catch(() => {});
    apiFetch<string[]>('/api/admin/teams/wheel')
      .then(setAvailableNations)
      .catch(() => {});
  }, []);

  const spin = async () => {
    if (!selectedPlayerId) return;
    setSpinning(true);
    setResult(null);
    try {
      await new Promise((r) => setTimeout(r, 2000));
      const allocation = await apiFetch<{ profileId: string; nation: string }>(
        '/api/admin/teams/allocate',
        { method: 'POST', body: JSON.stringify({ profileId: selectedPlayerId }) },
      );
      setResult(allocation);
      // Refresh available nations
      const nations = await apiFetch<string[]>('/api/admin/teams/wheel');
      setAvailableNations(nations);
      // Refresh players
      const updatedPlayers = await apiFetch<Player[]>('/api/admin/players');
      setPlayers(updatedPlayers);
    } catch {
      // silently handle
    } finally {
      setSpinning(false);
    }
  };

  const unassignedPlayers = players.filter((p) => !p.selected_team);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Kader Çarkı</h1>
      <div className="flex flex-col items-center gap-8 rounded-xl border border-neutral-800 bg-neutral-900 p-12">
        {/* Player dropdown */}
        <div className="w-64">
          <label htmlFor="player-select" className="mb-1 block text-sm text-neutral-400">
            Oyuncu Seç
          </label>
          <select
            id="player-select"
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100"
          >
            <option value="">Oyuncu seçin...</option>
            {unassignedPlayers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.username}
              </option>
            ))}
          </select>
          {unassignedPlayers.length === 0 && players.length > 0 && (
            <p className="mt-1 text-xs text-amber-400">Tüm oyunculara takım atanmış!</p>
          )}
        </div>

        {/* Wheel */}
        <div className="relative flex h-64 w-64 items-center justify-center rounded-full border-4 border-accent">
          <span className="text-6xl">{spinning ? '🎰' : result?.nation ? '🏆' : '🎯'}</span>
          {spinning && (
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-accent" />
          )}
        </div>

        <button
          type="button"
          onClick={spin}
          disabled={spinning || !selectedPlayerId}
          className="rounded-xl bg-accent px-8 py-3 text-lg font-bold text-black disabled:opacity-50"
        >
          {spinning ? 'Çark Dönüyor...' : 'Çarkı Çevir!'}
        </button>

        {result && (
          <div className="rounded-xl bg-accent/10 px-8 py-4 text-center">
            <p className="text-sm text-neutral-400">Atanan Takım</p>
            <p className="text-3xl font-bold text-accent">{result.nation}</p>
          </div>
        )}

        {/* Assigned players */}
        <div className="w-full space-y-2">
          <h3 className="text-sm text-neutral-400">
            Kalan Takımlar ({availableNations.length}/48)
          </h3>
          <div className="flex flex-wrap gap-1">
            {availableNations.slice(0, 12).map((n) => (
              <span key={n} className="rounded bg-neutral-800 px-2 py-0.5 text-xs">
                {n}
              </span>
            ))}
          </div>

          <h3 className="mt-4 text-sm text-neutral-400">Atanmış Takımlar</h3>
          <div className="space-y-1">
            {players
              .filter((p) => p.selected_team)
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded bg-neutral-800/50 px-3 py-1.5 text-sm"
                >
                  <span>{p.username}</span>
                  <span className="text-accent">{p.selected_team}</span>
                </div>
              ))}
            {players.filter((p) => p.selected_team).length === 0 && (
              <p className="text-xs text-neutral-500">Henüz takım atanmadı</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
