import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function ErrorPage() {
  const location = useLocation();

  return (
    <>
      <Helmet>
        <title>Unexpected Error | Big Cities Event Monitor</title>
        <meta name="description" content="A friendly error state for unexpected runtime issues." />
      </Helmet>
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-4xl border border-slate-200 bg-white/80 p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/80" role="alert" aria-live="assertive">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-600">Error</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">Something went wrong</h1>
        <p className="mt-3 max-w-xl text-sm text-slate-600 dark:text-slate-400">We could not load this page. Please try again or return home.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={() => window.location.reload()}>Retry</Button>
          <Link to="/" className="inline-flex">
            <Button variant="outline">Go home</Button>
          </Link>
        </div>
      </div>
    </>
  );
}

