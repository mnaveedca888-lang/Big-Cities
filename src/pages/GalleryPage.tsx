import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';

const images = [
  'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80',
];

export default function GalleryPage() {
  return (
    <>
      <Helmet>
        <title>Gallery | Big Cities Event Monitor</title>
        <meta name="description" content="Browse event imagery from flagship gatherings and premium experiences." />
      </Helmet>
      <div className="space-y-8">
        <div className="rounded-4xl border border-slate-200 bg-white/80 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Event gallery</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">A visual library for event highlights and immersive storytelling.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {images.map((image) => (
            <Card key={image} className="overflow-hidden p-0">
              <img src={image} alt="Event gallery" className="h-56 w-full object-cover" />
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

