import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { SafeImage } from '@/components/ui/safe-image';
import { getEvents } from '@/services/events';
import { normalizeImageUrl } from '@/utils/imageValidation';

export default function GalleryPage() {
  const { data: events = [] } = useQuery({ queryKey: ['gallery-events'], queryFn: () => getEvents({ perPage: 12 }) });
  const galleryEvents = events.filter((event) => normalizeImageUrl(event.image)).slice(0, 3);

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
        {galleryEvents.length ? (
          <div className="grid gap-6 md:grid-cols-3">
            {galleryEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden p-0">
              <SafeImage src={event.image} alt={event.title} className="h-56 w-full object-cover" fallbackClassName="flex h-56 w-full items-center justify-center bg-slate-100 text-sm text-slate-500" />
              <p className="p-4 text-sm font-medium text-slate-900 dark:text-white">{event.title}</p>
            </Card>
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-slate-500">No locally stored event images are available.</p>
        )}
      </div>
    </>
  );
}

