import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';

export default function AdminAnalyticsPage() {
  return (
    <>
      <Helmet>
        <title>Admin Analytics | Big Cities Event Monitor</title>
      </Helmet>
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Traffic growth</h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Platform engagement continues to rise across destination pages and event listings.</p>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Conversion health</h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Sign-up and retention metrics remain healthy for the enterprise audience segment.</p>
          </Card>
        </div>
      </div>
    </>
  );
}

