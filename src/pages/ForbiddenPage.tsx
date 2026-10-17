import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
  return (
    <>
      <Helmet>
        <title>Forbidden | Big Cities Event Monitor</title>
        <meta name="description" content="You do not have permission to access this workspace area." />
      </Helmet>
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-4xl border border-slate-200 bg-white/80 p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Forbidden</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Your role does not permit access to this content.</p>
        <Link to="/dashboard" className="mt-6">
          <Button>Back to dashboard</Button>
        </Link>
      </div>
    </>
  );
}

