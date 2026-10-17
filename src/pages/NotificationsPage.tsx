import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const notifications = [
  { title: 'AI Summit 2026 moved to a larger venue', meta: 'San Francisco - 18 Sep', level: 'High' },
  { title: 'New Singapore events match your AI policy watchlist', meta: '5 new events', level: 'New' },
  { title: 'Weekly digest is ready for review', meta: 'Dashboard summary', level: 'Digest' },
];

export default function NotificationsPage() {
  return (
    <>
      <Helmet>
        <title>Notifications | Big Cities Event Monitor</title>
        <meta name="description" content="Stay informed with important updates and alerts for your event watchlist." />
      </Helmet>
      <div className="space-y-6">
        <div className="rounded-4xl border border-slate-200 bg-white/80 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Your notifications</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">Track urgent event changes, saved-search matches, and team activity from one inbox.</p>
        </div>
        <Card className="divide-y divide-slate-200 p-0 dark:divide-slate-800">
          {notifications.map((item) => (
            <article key={item.title} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-slate-950 dark:text-white">{item.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{item.meta}</p>
              </div>
              <Badge>{item.level}</Badge>
            </article>
          ))}
        </Card>
      </div>
    </>
  );
}

