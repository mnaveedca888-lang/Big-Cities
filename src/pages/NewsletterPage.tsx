import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useState } from 'react';

export default function NewsletterPage() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    window.setTimeout(() => setSubscribed(false), 1800);
  };

  return (
    <>
      <Helmet>
        <title>Newsletter | Big Cities Event Monitor</title>
        <meta name="description" content="Subscribe to receive curated event updates and insider recommendations." />
      </Helmet>
      <div className="space-y-8">
        <Card className="space-y-4">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Stay connected</h1>
          <p className="text-slate-600 dark:text-slate-400">Subscribe for tailored updates on premium AI and innovation gatherings.</p>
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit} noValidate>
            <label className="flex-1">
              <span className="sr-only">Email address</span>
              <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" type="email" aria-label="Email address" />
            </label>
            <Button type="submit" disabled={!email.trim()}>{subscribed ? 'Subscribed' : 'Subscribe'}</Button>
          </form>
        </Card>
      </div>
    </>
  );
}

