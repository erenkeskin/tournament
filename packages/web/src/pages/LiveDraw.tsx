import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export function LiveDraw() {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ nation: string } | null>(null);
  const [availableNations, setAvailableNations] = useState<string[]>([]);
  const [profileId, setProfileId] = useState('');

  const spin = async () => {
    if (!profileId) return;
    setSpinning(true);
    setResult(null);
    try {
      const nations = await apiFetch<string[]>('/api/admin/teams/wheel');
      setAvailableNations(nations);
      await new Promise((r) => setTimeout(r, 2000));
      const allocation = await apiFetch<{ profileId: string; nation: string }>(
        '/api/admin/teams/allocate',
        {
          method: 'POST',
          body: JSON.stringify({ profileId }),
        },
      );
      setResult(allocation);
    } catch {
      // silently handle
    } finally {
      setSpinning(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Kader Çarkı</h1>
      <div className="flex flex-col items-center gap-8 rounded-xl border border-neutral-800 bg-neutral-900 p-12">
        <input
          type="text"
          placeholder="Oyuncu ID"
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 w-64"
        />
        <div className="relative flex h-64 w-64 items-center justify-center rounded-full border-4 border-accent">
          <span className="text-6xl">{spinning ? '🎰' : result?.nation ? '🏆' : '🎯'}</span>
          {spinning && (
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-accent" />
          )}
        </div>
        <button
          type="button"
          onClick={spin}
          disabled={spinning || !profileId}
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
        <div className="w-full">
          <h3 className="mb-2 text-sm text-neutral-400">
            Kalan Takımlar ({availableNations.length}/48)
          </h3>
          <div className="flex flex-wrap gap-1">
            {availableNations.slice(0, 12).map((n) => (
              <span key={n} className="rounded bg-neutral-800 px-2 py-0.5 text-xs">
                {n}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
