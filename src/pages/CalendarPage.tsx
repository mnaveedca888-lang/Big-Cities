import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const calendarEvents = [
  { day: '18', month: 'Sep', title: 'AI Summit 2026', city: 'San Francisco', category: 'AI' },
  { day: '05', month: 'Oct', title: 'Global ML Forum', city: 'Singapore', category: 'ML' },
  { day: '22', month: 'Oct', title: 'Responsible AI Week', city: 'London', category: 'Policy' },
  { day: '07', month: 'Nov', title: 'Founders AI Night', city: 'Berlin', category: 'Startup' },
];

export default function CalendarPage() {
  return (
    <>
      <Helmet>
        <title>Calendar | Big Cities Event Monitor</title>
        <meta name="description" content="Review a premium event calendar with day, week, and month views." />
      </Helmet>
      <div className="space-y-8">
        <div className="rounded-4xl border border-slate-200 bg-white/80 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Event calendar</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">Plan your month with a structured calendar experience designed for live discovery.</p>
        </div>
        <Card className="p-0">
          {calendarEvents.map((event) => (
            <article key={event.title} className="grid gap-4 border-b border-slate-100 p-5 last:border-0 dark:border-slate-800 sm:grid-cols-[5rem_1fr_auto] sm:items-center">
              <div className="rounded-2xl bg-slate-100 p-3 text-center dark:bg-slate-800">
                <p className="text-xs font-semibold uppercase text-slate-500">{event.month}</p>
                <p className="text-2xl font-semibold text-slate-950 dark:text-white">{event.day}</p>
              </div>
              <div>
                <h2 className="font-semibold text-slate-950 dark:text-white">{event.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{event.city}</p>
              </div>
              <Badge>{event.category}</Badge>
            </article>
          ))}
        </Card>
      </div>
    </>
  );
}

