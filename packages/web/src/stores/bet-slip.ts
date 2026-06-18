import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

interface BetSlipState {
  isOpen: boolean;
  matchId: string | null;
  betType: 'HOME' | 'DRAW' | 'AWAY' | null;
  amount: number;
  potentialPayout: number;
  openSlip: (matchId: string, betType: 'HOME' | 'DRAW' | 'AWAY', odds: number) => void;
  closeSlip: () => void;
  setAmount: (amount: number, odds: number) => void;
  placeBet: () => Promise<void>;
}

export const useBetSlipStore = create<BetSlipState>((set, get) => ({
  isOpen: false,
  matchId: null,
  betType: null,
  amount: 0,
  potentialPayout: 0,

  openSlip: (matchId, betType, _odds) => {
    set({ isOpen: true, matchId, betType, amount: 0, potentialPayout: 0 });
  },

  closeSlip: () => set({ isOpen: false }),

  setAmount: (amount, odds) => {
    set({ amount, potentialPayout: Math.round(amount * odds * 100) / 100 });
  },

  placeBet: async () => {
    const { matchId, betType, amount } = get();
    if (!matchId || !betType || amount <= 0) return;
    await apiFetch('/api/bets', {
      method: 'POST',
      body: JSON.stringify({ matchId, betType, amount }),
    });
    set({ isOpen: false, amount: 0, potentialPayout: 0 });
  },
}));
