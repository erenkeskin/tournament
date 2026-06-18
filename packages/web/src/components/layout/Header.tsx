import { AlertCircle, Skull } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useRealtime } from '@/hooks/useRealtime';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

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

export function Header() {
  const { profile } = useAuthStore();
  const [balance, setBalance] = useState<number | null>(null);

  const fetchBalance = useCallback(() => {
    apiFetch<{ balance: number }>('/api/wallet')
      .then((data) => setBalance(data.balance))
      .catch(() => setBalance(null));
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);
  useRealtime('wallets', () => {
    fetchBalance();
  });

  const isBankrupt = balance !== null && balance <= 0;
  const avatarEmoji = profile?.avatar_url ? AVATARS[profile.avatar_url] || '👤' : '👤';

  return (
    <header className="flex items-center justify-between border-b border-border bg-pitch/60 backdrop-blur-xl px-6 py-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-400/80">
          <AlertCircle className="h-3.5 w-3.5" />
          Eyyam tamamiyle yasaktır!
        </div>
        {isBankrupt && (
          <div className="flex items-center gap-1.5 rounded-full bg-red-card/15 px-3 py-1.5 text-xs font-bold text-red-card">
            <Skull className="h-3.5 w-3.5" /> İFLAS
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* VP */}
        <div className="rounded-xl bg-surface px-4 py-1.5 font-mono text-sm">
          <span className="text-chalk-muted">VP </span>
          <span className={`font-bold tabular-nums ${isBankrupt ? 'text-red-card' : 'text-gold'}`}>
            {balance !== null ? balance.toFixed(0) : '---'}
          </span>
        </div>

        {/* Player avatar + name */}
        {profile && (
          <div className="flex items-center gap-2">
            <span className="text-lg">{avatarEmoji}</span>
            <span className="text-sm font-medium text-chalk">{profile.username}</span>
          </div>
        )}
      </div>
    </header>
  );
}
