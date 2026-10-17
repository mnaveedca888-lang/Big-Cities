import { Link, useLocation } from 'react-router-dom';

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
      <Link to="/" className="hover:text-slate-900 dark:hover:text-white">Home</Link>
      {segments.map((segment, index) => {
        const path = `/${segments.slice(0, index + 1).join('/')}`;
        const label = segment.replace(/-/g, ' ');
        const isLast = index === segments.length - 1;
        return (
          <span key={path} className="flex items-center gap-2">
            <span>/</span>
            {isLast ? <span className="capitalize text-slate-900 dark:text-white">{label}</span> : <Link to={path} className="capitalize hover:text-slate-900 dark:hover:text-white">{label}</Link>}
          </span>
        );
      })}
    </nav>
  );
}
