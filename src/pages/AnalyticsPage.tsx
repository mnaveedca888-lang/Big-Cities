import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';

export default function AnalyticsPage() {
  return (
    <>
      <Helmet>
        <title>Analytics | Big Cities Event Monitor</title>
        <meta name="description" content="Review analytical summaries and event trends in the dashboard." />
      </Helmet>
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Event trend</h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Volume is accelerating across AI, startup, and enterprise innovation categories.</p>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Geographic momentum</h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">North America remains the leader while Asia Pacific continues to expand quickly.</p>
          </Card>
        </div>
      </div>
    </>
  );
}

