import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';

export default function BlogPage() {
  return (
    <>
      <Helmet>
        <title>Blog | Big Cities Event Monitor</title>
        <meta name="description" content="Read thought leadership and product updates about the platform." />
      </Helmet>
      <div className="space-y-8">
        <div className="rounded-4xl border border-slate-200 bg-white/80 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Blog and insights</h1>
          <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-400">Read practical perspectives on intelligent event discovery, monitoring, and the future of global innovation platforms.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {['How event discovery is evolving', 'Designing credible AI event intelligence'].map((title) => (
            <Card key={title} className="space-y-3">
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">{title}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">A future-ready content experience for product updates, insights, and thought leadership.</p>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

