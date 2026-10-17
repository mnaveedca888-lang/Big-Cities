import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <>
      <Helmet>
        <title>404 | Big Cities Event Monitor</title>
        <meta name="description" content="The requested page could not be found." />
      </Helmet>
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-4xl border border-slate-200 bg-white/80 p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-600">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">Page not found</h1>
        <p className="mt-3 max-w-xl text-sm text-slate-600 dark:text-slate-400">The route may be unavailable or the page may have moved. Return to the platform homepage.</p>
        <Link to="/" className="mt-6">
          <Button>Back to home</Button>
        </Link>
      </div>
    </>
  );
}

