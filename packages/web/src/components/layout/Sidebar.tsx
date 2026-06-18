import { Dices, LayoutDashboard, Radio, ScrollText, ShieldAlert, Trophy } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/fixtures', icon: ScrollText, label: 'Fikstür' },
  { to: '/betting', icon: Dices, label: 'Bahis' },
  { to: '/draw', icon: Radio, label: 'Kader Çarkı' },
  { to: '/admin', icon: ShieldAlert, label: 'Admin' },
];

export function Sidebar() {
  return (
    <aside className="flex w-56 flex-col border-r border-neutral-800 bg-neutral-900 p-4">
      <div className="mb-8 flex items-center gap-2">
        <Trophy className="h-7 w-7 text-accent" />
        <span className="text-lg font-bold tracking-tight">VIG FIFA</span>
      </div>
      <nav className="flex flex-col gap-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
