import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';

const faqs = [
  ['How do I discover events?', 'Use the search and filters to narrow by category, city, country, or organizer.'],
  ['Can I save events?', 'Yes, the platform is prepared for personalized watchlists and saved event workflows.'],
  ['Is the data real-time?', 'The frontend is wired for future real-time backend integration and live updates.'],
];

export default function FAQPage() {
  return (
    <>
      <Helmet>
        <title>FAQ | Big Cities Event Monitor</title>
        <meta name="description" content="Answer common questions about discovery, onboarding, and platform features." />
      </Helmet>
      <div className="space-y-8">
        <div className="rounded-4xl border border-slate-200 bg-white/80 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Frequently asked questions</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">A polished support layer for onboarding and product education.</p>
        </div>
        <div className="space-y-4">
          {faqs.map(([question, answer]) => (
            <Card key={question}>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{question}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{answer}</p>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

