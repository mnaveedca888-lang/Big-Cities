import { Outlet, Link, NavLink } from 'react-router-dom';
import { LayoutGrid, BellRing, Settings, User, BarChart3 } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutGrid },
  { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/notifications', label: 'Notifications', icon: BellRing },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function DashboardLayout() {
  return (
    <div className="grid min-h-screen gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="border-b border-slate-200 bg-slate-50/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 lg:border-b-0 lg:border-r lg:p-6">
        <Link to="/" className="text-xl font-semibold text-slate-950 dark:text-white">Dashboard Hub</Link>
        <nav className="mt-8 space-y-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${isActive ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'}`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="p-4 sm:p-6 lg:p-8">
        <Outlet />
      </div>
    </div>
  );
}
