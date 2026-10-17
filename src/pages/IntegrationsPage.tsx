import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const integrations = [
  ['Analytics', 'Sync event performance and audience signals into BI dashboards.'],
  ['CRM', 'Route organizer and attendee activity into sales workflows.'],
  ['Email', 'Send saved-search digests and event reminders to workspace members.'],
  ['Data API', 'Export normalized event records for internal enrichment.'],
];

export default function IntegrationsPage() {
  return (
    <>
      <Helmet>
        <title>Integrations | Big Cities Event Monitor</title>
        <meta name="description" content="Explore integration options and extension points for the platform." />
      </Helmet>
      <div className="space-y-8">
        <div className="rounded-4xl border border-slate-200 bg-white/80 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Integrations</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">Connect event intelligence with the tools teams already use to plan, measure, and follow up.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {integrations.map(([title, description]) => (
            <Card key={title} className="space-y-3">
              <Badge>{title}</Badge>
              <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

