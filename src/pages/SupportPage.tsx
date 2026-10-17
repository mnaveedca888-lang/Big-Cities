import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';

export default function SupportPage() {
  return (
    <>
      <Helmet>
        <title>Support | Big Cities Event Monitor</title>
        <meta name="description" content="Access support resources and premium assistance for account and platform questions." />
      </Helmet>
      <div className="space-y-8">
        <Card>
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Support center</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Enterprise support and customer success resources will appear here as the platform grows.</p>
        </Card>
      </div>
    </>
  );
}

