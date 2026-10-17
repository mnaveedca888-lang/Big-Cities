import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';

export default function SecurityPage() {
  return (
    <>
      <Helmet>
        <title>Security | Big Cities Event Monitor</title>
        <meta name="description" content="Review platform security posture and policy readiness." />
      </Helmet>
      <div className="space-y-8">
        <Card>
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Security</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">The frontend is structured for secure session handling, role-based access, and future compliance workflows.</p>
        </Card>
      </div>
    </>
  );
}

