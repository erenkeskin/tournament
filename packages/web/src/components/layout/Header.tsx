import { AlertCircle, Skull } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useRealtime } from '@/hooks/useRealtime';
import { apiFetch } from '@/lib/api';

export function Header() {
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

  return (
    <header className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900 px-6 py-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-amber-400">
          <AlertCircle className="h-4 w-4" />
          <span className="font-medium">Eyyam tamamiyle yasaktır!</span>
        </div>
        {isBankrupt && (
          <div className="flex items-center gap-1.5 rounded bg-red-900/30 px-2.5 py-1 text-xs text-red-400">
            <Skull className="h-3.5 w-3.5" />
            <span className="font-bold">İFLAS</span>
          </div>
        )}
      </div>
      <div className="rounded-lg bg-neutral-800 px-3 py-1.5 text-sm">
        <span className="text-neutral-400">VP: </span>
        <span className={`font-bold tabular-nums ${isBankrupt ? 'text-red-400' : 'text-accent'}`}>
          {balance !== null ? balance.toFixed(0) : '---'}
        </span>
      </div>
    </header>
  );
}
