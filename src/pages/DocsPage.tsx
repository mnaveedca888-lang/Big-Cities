import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';

export default function DocsPage() {
  return (
    <>
      <Helmet>
        <title>Documentation | Big Cities Event Monitor</title>
        <meta name="description" content="Reference the platform architecture and future integration points." />
      </Helmet>
      <div className="space-y-8">
        <div className="rounded-4xl border border-slate-200 bg-white/80 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Documentation</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">The frontend is structured for enterprise growth with scalable routing, services, and reusable components.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Architecture</h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Routes, layouts, services, hooks, styles, and providers are organized for maintainability and scale.</p>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Integration</h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Axios and the service layer are prepared to connect to secure backend endpoints later.</p>
          </Card>
        </div>
      </div>
    </>
  );
}

