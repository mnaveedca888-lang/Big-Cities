import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function OfflinePage() {
  return (
    <>
      <Helmet>
        <title>Offline | Big Cities Event Monitor</title>
        <meta name="description" content="The app is currently offline or unavailable." />
      </Helmet>
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-4xl border border-slate-200 bg-white/80 p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">You are offline</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Reconnect to continue browsing global events and updates.</p>
        <Link to="/" className="mt-6">
          <Button>Retry</Button>
        </Link>
      </div>
    </>
  );
}

