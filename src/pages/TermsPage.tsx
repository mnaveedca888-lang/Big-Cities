import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';

export default function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Terms | Big Cities Event Monitor</title>
        <meta name="description" content="View the product terms and usage expectations for the platform." />
      </Helmet>
      <div className="space-y-6">
        <Card>
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Terms of use</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">These terms define expected use of the platform as it grows into a full enterprise product.</p>
        </Card>
      </div>
    </>
  );
}

