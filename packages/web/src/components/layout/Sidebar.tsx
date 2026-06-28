import { ArrowLeft, Coins, LogOut, Radio, ShieldAlert, Trophy } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';

const links = [
  { to: '/draw', icon: Radio, label: 'Kader Çarkı' },
  { to: '/admin', icon: ShieldAlert, label: 'Admin Paneli' },
  { to: '/admin/bets', icon: Coins, label: 'Bahis Takip' },
];

export function Sidebar() {
  const { signOut } = useAuthStore();
  const navigate = useNavigate();

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-border bg-pitch/80 backdrop-blur-xl">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15">
          <Trophy className="h-5 w-5 text-gold" />
        </div>
        <span className="font-display text-xl tracking-wider text-chalk">ADMIN</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gold/10 text-gold'
                  : 'text-chalk-muted hover:bg-surface hover:text-chalk',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-5 py-4 space-y-2">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-chalk-muted hover:bg-surface hover:text-chalk transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> Ana Sayfa
        </button>
        <button
          type="button"
          onClick={async () => {
            await signOut();
            navigate('/');
          }}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-chalk-muted hover:bg-surface hover:text-red-card transition-all"
        >
          <LogOut className="h-4 w-4" /> Çıkış
        </button>
      </div>
    </aside>
  );
}
