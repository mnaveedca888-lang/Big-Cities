import { Link, NavLink } from 'react-router-dom';
import { LayoutGrid, BarChart3, BellRing, User, Settings, ShieldCheck } from 'lucide-react';

const items = [
  { to: '/dashboard', label: 'Overview', icon: LayoutGrid },
  { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/notifications', label: 'Notifications', icon: BellRing },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/admin', label: 'Admin', icon: ShieldCheck },
];

export function Sidebar() {
  return (
    <aside className="h-full rounded-4xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-950/40">
      <Link to="/" className="text-lg font-semibold text-slate-950 dark:text-white">Enterprise Suite</Link>
      <nav className="mt-8 space-y-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${isActive ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
