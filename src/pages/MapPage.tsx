import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const regions = [
  { city: 'San Francisco', events: 428, top: 'Model infrastructure', x: '18%', y: '42%' },
  { city: 'London', events: 312, top: 'AI governance', x: '48%', y: '35%' },
  { city: 'Singapore', events: 286, top: 'Enterprise AI', x: '72%', y: '58%' },
  { city: 'Sydney', events: 144, top: 'Robotics', x: '82%', y: '76%' },
];

export default function MapPage() {
  return (
    <>
      <Helmet>
        <title>Map | Big Cities Event Monitor</title>
        <meta name="description" content="Visualize event clusters and regional opportunities on a premium map surface." />
      </Helmet>
      <div className="space-y-8">
        <div className="rounded-4xl border border-slate-200 bg-white/80 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Interactive map</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">Visualize event clusters, regional momentum, and the cities driving global AI activity.</p>
        </div>
        <Card className="overflow-hidden p-0">
          <div className="relative min-h-[22rem] bg-slate-950">
            <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'radial-gradient(circle at 20% 40%, rgba(34,211,238,0.32), transparent 18%), radial-gradient(circle at 72% 58%, rgba(16,185,129,0.24), transparent 16%), linear-gradient(135deg, #0f172a 0%, #111827 52%, #082f49 100%)' }} />
            <div className="absolute inset-6 rounded-4xl border border-white/10" />
            {regions.map((region) => (
              <div key={region.city} className="absolute" style={{ left: region.x, top: region.y }}>
                <span className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/30" />
                <span className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300" />
                <div className="ml-3 mt-2 min-w-36 rounded-2xl border border-white/10 bg-white/10 p-3 text-white backdrop-blur">
                  <p className="text-sm font-semibold">{region.city}</p>
                  <p className="text-xs text-slate-300">{region.events} events</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <div className="grid gap-4 md:grid-cols-4">
          {regions.map((region) => (
            <Card key={region.city} className="space-y-2">
              <Badge>{region.city}</Badge>
              <p className="text-2xl font-semibold text-slate-950 dark:text-white">{region.events}</p>
              <p className="text-sm text-slate-500">{region.top}</p>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

