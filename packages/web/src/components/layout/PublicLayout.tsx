import {
  Coins,
  GitBranch,
  LayoutDashboard,
  LogIn,
  LogOut,
  Swords,
  Trophy,
  UserPlus,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AuthDialog } from '@/components/auth/AuthDialog';
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

export function PublicLayout() {
  const { user, profile, signOut } = useAuthStore();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [balance, setBalance] = useState<number | null>(null);
  const navigate = useNavigate();

  const avatarEmoji = profile?.avatar_url ? AVATARS[profile.avatar_url] || '👤' : '👤';

  const fetchBalance = useCallback(() => {
    if (!user) return;
    apiFetch<{ balance: number }>('/api/wallet')
      .then((d) => setBalance(d.balance))
      .catch(() => setBalance(null));
  }, [user]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return (
    <div className="min-h-screen bg-pitch">
      {/* Public nav bar */}
      <nav className="sticky top-0 z-40 border-b border-border/50 bg-pitch/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          {/* Brand */}
          <NavLink to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/15">
              <Trophy className="h-4 w-4 text-gold" />
            </div>
            <span className="font-display text-lg tracking-wider text-chalk">VIG FIFA</span>
          </NavLink>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            <NavLink
              to="/fixtures"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? 'text-gold bg-gold/5' : 'text-chalk-muted hover:text-chalk'}`
              }
            >
              <span className="flex items-center gap-1.5">
                <Swords className="h-3.5 w-3.5" /> Fikstür
              </span>
            </NavLink>
            <NavLink
              to="/tree"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? 'text-gold bg-gold/5' : 'text-chalk-muted hover:text-chalk'}`
              }
            >
              <span className="flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5" /> Turnuva Ağacı
              </span>
            </NavLink>

            <div className="ml-4 h-5 w-px bg-border" />

            {/* VP Balance */}
            {user && balance !== null && (
              <div className="flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 mr-2">
                <Coins className="h-3.5 w-3.5 text-gold" />
                <span className="font-mono text-sm font-bold text-gold tabular-nums">
                  {balance.toFixed(0)}
                </span>
                <span className="text-xs text-chalk-muted">VP</span>
              </div>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                {profile?.is_admin && (
                  <button
                    type="button"
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-1.5 rounded-lg bg-gold/10 px-3 py-2 text-sm text-gold hover:bg-gold/20 transition-colors"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" /> Admin
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/apply')}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-chalk-muted hover:text-chalk transition-colors"
                >
                  <span className="text-base">{avatarEmoji}</span> {profile?.username}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    navigate('/');
                  }}
                  className="rounded-lg px-2 py-2 text-chalk-muted/50 hover:text-red-card transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setAuthOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-chalk-muted hover:text-chalk transition-colors"
                >
                  <LogIn className="h-4 w-4" /> Giriş
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthOpen(true);
                  }}
                  className="btn-primary text-xs !py-2 !px-4"
                >
                  <UserPlus className="h-4 w-4" /> Kayıt Ol
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center">
        <p className="font-mono text-sm text-chalk-muted/40">⚠ Eyyam tamamiyle yasaktır!</p>
      </footer>

      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </div>
  );
}
