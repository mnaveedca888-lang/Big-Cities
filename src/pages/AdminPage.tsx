import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Table } from '@/components/ui/table';

const rows = [
  ['AI Summit', 'San Francisco', 'Live'],
  ['Founder Network', 'London', 'Draft'],
  ['ML Forum', 'Singapore', 'Approved'],
];

export default function AdminPage() {
  return (
    <>
      <Helmet>
        <title>Admin | Big Cities Event Monitor</title>
        <meta name="description" content="Manage event operations, approvals, and platform administration." />
      </Helmet>
      <div className="space-y-8">
        <div className="rounded-4xl border border-slate-200 bg-white/80 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Admin console</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">Operational controls and moderation tools for large-scale event programs.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            ['Active events', '184'],
            ['Pending approvals', '27'],
            ['Flagged content', '5'],
          ].map(([label, value]) => (
            <Card key={label} className="text-center">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{value}</p>
            </Card>
          ))}
        </div>
        <Table headers={['Event', 'City', 'Status']} rows={rows.map((row) => <><td className="px-4 py-3">{row[0]}</td><td className="px-4 py-3">{row[1]}</td><td className="px-4 py-3">{row[2]}</td></>)} />
      </div>
    </>
  );
}

