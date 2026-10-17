import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PricingPage() {
  return (
    <>
      <Helmet>
        <title>Pricing | Big Cities Event Monitor</title>
        <meta name="description" content="Review scalable pricing options for the platform." />
      </Helmet>
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            ['Starter', '$29', 'Core discovery experience'],
            ['Growth', '$79', 'Advanced analysis and monitoring'],
            ['Enterprise', '$199', 'Custom workflows and integrations'],
          ].map(([name, price, description]) => (
            <Card key={name} className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">{name}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
              <p className="text-3xl font-semibold text-slate-950 dark:text-white">{price}</p>
              <Button>Choose plan</Button>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

