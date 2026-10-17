import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';

export default function CareersPage() {
  return (
    <>
      <Helmet>
        <title>Careers | Big Cities Event Monitor</title>
        <meta name="description" content="Explore future opportunities to work on the platform." />
      </Helmet>
      <div className="space-y-8">
        <Card className="space-y-4">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Join the team</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">We are building a next-generation platform for global event intelligence and discovery.</p>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            Open roles are prepared for future expansion as the product matures and the team grows.
          </div>
        </Card>
      </div>
    </>
  );
}

