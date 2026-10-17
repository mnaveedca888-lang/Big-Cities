import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const services = [
  ['Web app', 'Operational', '99.99%'],
  ['Search index', 'Operational', '99.95%'],
  ['Notifications', 'Operational', '99.91%'],
];

export default function StatusPage() {
  return (
    <>
      <Helmet>
        <title>Status | Big Cities Event Monitor</title>
        <meta name="description" content="Review platform health and operational status information." />
      </Helmet>
      <div className="space-y-8">
        <div className="rounded-4xl border border-slate-200 bg-white/80 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Platform status</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">All monitored frontend services are healthy, with clear status visibility for users and operators.</p>
        </div>
        <Card className="divide-y divide-slate-200 p-0 dark:divide-slate-800">
          {services.map(([name, state, uptime]) => (
            <div key={name} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-slate-950 dark:text-white">{name}</h2>
                <p className="mt-1 text-sm text-slate-500">30-day uptime: {uptime}</p>
              </div>
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">{state}</Badge>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}

