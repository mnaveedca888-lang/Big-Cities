import { Outlet, Link, NavLink } from 'react-router-dom';
import { ShieldCheck, Users, BarChart3, Settings } from 'lucide-react';

const items = [
  { to: '/admin', label: 'Overview', icon: ShieldCheck },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout() {
  return (
    <div className="grid min-h-screen gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="border-b border-slate-200 bg-slate-50/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 lg:border-b-0 lg:border-r lg:p-6">
        <Link to="/" className="text-lg font-semibold text-slate-950 dark:text-white">Admin Console</Link>
        <nav className="mt-8 space-y-2">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${isActive ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
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
