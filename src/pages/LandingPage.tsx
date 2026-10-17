import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <>
      <Helmet>
        <title>Launch | Big Cities Event Monitor</title>
        <meta name="description" content="Explore the premium launch experience for the platform." />
      </Helmet>
      <div className="space-y-8">
        <Card className="space-y-4">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Launch experience</h1>
          <p className="text-slate-600 dark:text-slate-400">A high-conviction launch surface for enterprise clients and strategic partners.</p>
          <Button>Request demo</Button>
        </Card>
      </div>
    </>
  );
}

