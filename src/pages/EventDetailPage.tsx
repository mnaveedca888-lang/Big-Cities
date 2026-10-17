import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarDays, MapPin, Share2, Ticket, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataState } from '@/components/ui/data-state';
import { SafeImage } from '@/components/ui/safe-image';
import { getEvent } from '@/services/events';

function formatDate(value?: string | null, includeTime = false) {
  if (!value) return 'TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric', ...(includeTime ? { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Karachi', timeZoneName: 'short' } : {}) }).format(date);
}

function formatEventDate(event: { startAt?: string | null; endAt?: string | null; date?: string | null; dateOnly?: boolean }) {
  const start = event.startAt || event.date;
  if (event.dateOnly === true || !start) return formatDate(start);
  const startLabel = formatDate(start, true);
  const endLabel = event.endAt ? formatDate(event.endAt, true) : '';
  return endLabel ? `${startLabel} - ${endLabel}` : startLabel;
}

function extractHistoricalDateFromDescription(description?: string | null) {
  if (!description) return '';
  const match = description.match(/Document date:\s*(.+?)(?:\n|$)/i);
  return match?.[1]?.trim() || '';
}

function extractHistoricalSignificanceFromDescription(description?: string | null) {
  if (!description) return '';
  const match = description.match(/Historical\/cultural significance:\s*(.+?)(?:\n|$)/i);
  return match?.[1]?.trim() || '';
}

function formatHistoricalDate(event: { description?: string | null; date?: string | null; dateText?: string | null; startAt?: string | null; endAt?: string | null; dateOnly?: boolean }) {
  const descriptionDate = extractHistoricalDateFromDescription(event?.description);
  if (descriptionDate) return descriptionDate;
  if (event?.dateText) return String(event.dateText);
  if (event?.date) return formatDate(event.date);
  return formatEventDate(event);
}

function formatLocation(event: { location?: string | null; city?: string | null; citySlug?: string | null; country?: string | null; countryCode?: string | null }) {
  if (event?.location) return event.location;
  const city = event?.city ?? event?.citySlug;
  const countryCode = event?.countryCode?.trim().toUpperCase();
  const country = event?.country ?? (countryCode === 'PK' ? 'Pakistan' : event?.countryCode);
  if (city && country) return `${city}, ${country}`;
  return city || country || 'Regional catalog entry';
}

function formatTags(tags?: string | string[] | null) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.filter(Boolean);
  return tags.split(',').map((tag) => tag.trim()).filter(Boolean);
}

export default function EventDetailPage() {
  const { slug = '' } = useParams();
  const eventQuery = useQuery({
    queryKey: ['event', slug],
    queryFn: () => getEvent(slug),
    enabled: Boolean(slug),
    refetchOnMount: 'always',
  });

  const event = eventQuery.data;
  const eventTags = useMemo(() => formatTags(event?.tags), [event?.tags]);
  const heroImage = event?.image ?? null;

  return (
    <>
      <Helmet>
        <title>{event?.title ? `${event.title} | Big Cities Event Monitor` : 'Event Details | Big Cities Event Monitor'}</title>
        <meta name="description" content={event?.description ? event.description : 'Explore event details, organizer information, venue information, and related content.'} />
      </Helmet>
      <DataState isLoading={eventQuery.isLoading} error={eventQuery.error ? 'This event is unavailable right now.' : undefined} onRetry={() => { void eventQuery.refetch(); }} isEmpty={!eventQuery.isLoading && !eventQuery.data} emptyTitle="Event not found" emptyDescription="The requested event is not available in the current catalog.">
        {event ? (
          <div className="space-y-8">
            <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white/80 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
              <div className="h-72 w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
                <SafeImage src={heroImage} alt={event.title || 'Event'} className="h-full w-full object-cover" fallbackClassName="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-500" />
              </div>
              <div className="space-y-6 p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    {eventTags.length > 0 ? <div className="mb-3 flex flex-wrap gap-2">{eventTags.slice(0, 3).map((tag) => <Badge key={tag}>{tag}</Badge>)}</div> : null}
                    <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">{event.title}</h1>
                    <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">{event.description || 'A historical event from the catalog.'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline"><Share2 className="mr-2 h-4 w-4" /> Share</Button>
                    <Button><Ticket className="mr-2 h-4 w-4" /> Reserve</Button>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-500"><CalendarDays className="h-4 w-4" /> Historical date</div>
                    <p className="font-semibold text-slate-950 dark:text-white">{formatHistoricalDate(event)}</p>
                  </Card>
                  <Card className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-500"><MapPin className="h-4 w-4" /> Location</div>
                    <p className="font-semibold text-slate-950 dark:text-white">{formatLocation(event)}</p>
                  </Card>
                  <Card className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-500"><Users className="h-4 w-4" /> Event category</div>
                    <p className="font-semibold text-slate-950 dark:text-white">{event.category ?? (eventTags.length > 0 ? eventTags.join(', ') : 'Not specified')}</p>
                  </Card>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Event overview</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">{event.description || 'This catalog entry highlights an important historical moment connected to the selected city or country.'}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-sm text-slate-500">Country</p>
                    <p className="mt-1 font-semibold text-slate-950 dark:text-white">{event.countryCode?.trim().toUpperCase() === 'PK' ? 'Pakistan' : (event.countryCode ?? 'Not specified')}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-sm text-slate-500">City</p>
                    <p className="mt-1 flex items-center gap-2 font-semibold text-slate-950 dark:text-white"><Users className="h-4 w-4" /> {event.citySlug ?? 'Regional'}</p>
                  </div>
                </div>
              </Card>
              <Card className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Event details</h2>
                <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                  <p><span className="font-semibold text-slate-950 dark:text-white">Historical date:</span> {formatHistoricalDate(event)}</p>
                  <p><span className="font-semibold text-slate-950 dark:text-white">Location:</span> {formatLocation(event)}</p>
                  {event.category ? <p><span className="font-semibold text-slate-950 dark:text-white">Event category:</span> {event.category}</p> : null}
                  {extractHistoricalSignificanceFromDescription(event.description) ? <p><span className="font-semibold text-slate-950 dark:text-white">Historical significance:</span> {extractHistoricalSignificanceFromDescription(event.description)}</p> : null}
                  {eventTags.length > 0 ? <p><span className="font-semibold text-slate-950 dark:text-white">Tags:</span> {eventTags.join(', ')}</p> : null}
                </div>
              </Card>
            </div>
          </div>
        ) : null}
      </DataState>
    </>
  );
}

