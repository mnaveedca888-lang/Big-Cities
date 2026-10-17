import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const reviewQueue = [
  { date: 'Sep 18', title: 'AI Summit 2026', status: 'Published', city: 'San Francisco' },
  { date: 'Oct 05', title: 'Global ML Forum', status: 'Review', city: 'Singapore' },
  { date: 'Oct 22', title: 'Responsible AI Week', status: 'Draft', city: 'London' },
  { date: 'Nov 07', title: 'Founders AI Night', status: 'Published', city: 'Berlin' },
];

export default function AdminCalendarPage() {
  return (
    <>
      <Helmet>
        <title>Admin Calendar | Big Cities Event Monitor</title>
      </Helmet>
      <div className="space-y-6">
        <div className="rounded-4xl border border-slate-200 bg-white/80 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Admin calendar</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">Review publishing dates, moderation status, and upcoming editorial workload.</p>
        </div>
        <Card className="p-0">
          <div className="grid border-b border-slate-200 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 sm:grid-cols-[7rem_1fr_8rem_9rem]">
            <span>Date</span>
            <span>Event</span>
            <span>Status</span>
            <span>City</span>
          </div>
          {reviewQueue.map((item) => (
            <div key={item.title} className="grid gap-2 border-b border-slate-100 px-5 py-4 last:border-0 dark:border-slate-800 sm:grid-cols-[7rem_1fr_8rem_9rem] sm:items-center">
              <span className="font-semibold text-slate-950 dark:text-white">{item.date}</span>
              <span className="text-sm text-slate-700 dark:text-slate-300">{item.title}</span>
              <Badge>{item.status}</Badge>
              <span className="text-sm text-slate-500">{item.city}</span>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}

