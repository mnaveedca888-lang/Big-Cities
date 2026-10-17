import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';

export default function AdminSettingsPage() {
  return (
    <>
      <Helmet>
        <title>Admin Settings | Big Cities Event Monitor</title>
      </Helmet>
      <div className="space-y-6">
        <Card>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Administration settings</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Fine-tune platform configuration and operational workflows.</p>
        </Card>
      </div>
    </>
  );
}

