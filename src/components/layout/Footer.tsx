import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50/70 py-12 dark:border-slate-800 dark:bg-slate-950/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="text-lg font-semibold text-slate-950 dark:text-white">Big Cities Event Monitor</p>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Explore major cities, event highlights, and global activity from one streamlined destination.</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Explore</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li><Link to="/categories" className="hover:text-slate-950 dark:hover:text-white">Categories</Link></li>
            <li><Link to="/countries" className="hover:text-slate-950 dark:hover:text-white">Countries</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Company</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li><Link to="/about" className="hover:text-slate-950 dark:hover:text-white">About</Link></li>
            <li><Link to="/contact" className="hover:text-slate-950 dark:hover:text-white">Contact</Link></li>
            <li><Link to="/privacy-policy" className="hover:text-slate-950 dark:hover:text-white">Privacy</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Resources</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li><Link to="/terms" className="hover:text-slate-950 dark:hover:text-white">Terms</Link></li>
            <li><Link to="/analytics" className="hover:text-slate-950 dark:hover:text-white">Analytics</Link></li>
            <li><Link to="/notifications" className="hover:text-slate-950 dark:hover:text-white">Notifications</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
