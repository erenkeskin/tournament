import {
  Dices,
  GitBranch,
  Home,
  LayoutDashboard,
  LogOut,
  Radio,
  ShieldAlert,
  Swords,
  Trophy,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/fixtures', icon: Swords, label: 'Fikstür' },
  { to: '/tree', icon: GitBranch, label: 'Turnuva Ağacı' },
  { to: '/betting', icon: Dices, label: 'Bahis' },
  { to: '/draw', icon: Radio, label: 'Kader Çarkı', admin: true },
  { to: '/admin', icon: ShieldAlert, label: 'Admin', admin: true },
];

export function Sidebar() {
  const { profile, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-pitch/80 backdrop-blur-xl">
      {/* Brand */}
      <NavLink
        to="/dashboard"
        className="flex items-center gap-2.5 border-b border-border px-5 py-5"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15">
          <Trophy className="h-5 w-5 text-gold" />
        </div>
        <span className="font-display text-xl tracking-wider text-chalk">VIG FIFA</span>
      </NavLink>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {links
          .filter((l) => !l.admin || profile?.is_admin)
          .map(({ to, icon: Icon, label }) => (
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
      <div className="border-t border-border px-5 py-4 space-y-3">
        <NavLink
          to="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-chalk-muted hover:bg-surface hover:text-chalk transition-all"
        >
          <Home className="h-4 w-4" /> Ana Sayfa
        </NavLink>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-chalk-muted hover:bg-surface hover:text-red-card transition-all"
        >
          <LogOut className="h-4 w-4" /> Çıkış
        </button>
      </div>
    </aside>
  );
}
