import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
  return (
    <>
      <Helmet>
        <title>Unauthorized | Big Cities Event Monitor</title>
        <meta name="description" content="You need access permission to view this area." />
      </Helmet>
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-4xl border border-slate-200 bg-white/80 p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Access denied</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">You need an authenticated session to access this section.</p>
        <Link to="/login" className="mt-6">
          <Button>Sign in</Button>
        </Link>
      </div>
    </>
  );
}

