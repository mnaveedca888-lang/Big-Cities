import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | Big Cities Event Monitor</title>
        <meta name="description" content="Review privacy practices and data handling principles." />
      </Helmet>
      <div className="space-y-6">
        <Card>
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Privacy policy</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">This product is prepared for future secure integrations and responsible data handling.</p>
        </Card>
      </div>
    </>
  );
}

