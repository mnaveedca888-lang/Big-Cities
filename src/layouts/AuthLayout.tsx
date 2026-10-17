import { Outlet, Link } from 'react-router-dom';
import { apiBaseUrl } from '@/config/runtime';

const logoImage = `${apiBaseUrl}/images/Logo_design_for_Big_Cities_202608061337_11zon.webp`;

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md overflow-hidden rounded-4xl border border-slate-200 bg-white/95 p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900/95 sm:p-8">
        <Link to="/" className="mb-4 flex items-center gap-3 text-xl font-semibold text-slate-950 dark:text-white">
          <img src={logoImage} alt="Big Cities Event Monitor logo" className="h-10 w-10 rounded-2xl object-contain bg-white shadow-sm" />
          <span>Big Cities Event Monitor</span>
        </Link>
        <Outlet />
      </div>
    </div>
  );
}
