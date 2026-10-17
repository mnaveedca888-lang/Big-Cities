import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SafeImage } from '@/components/ui/safe-image';
import type { EventItem } from '@/types';

interface EventCardProps {
  event: EventItem;
}

function formatDate(value?: string | null, includeTime = false) {
  if (!value) return 'Date TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime ? { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Karachi', timeZoneName: 'short' } : {}),
  }).format(date);
}

function formatEventDate(event: EventItem) {
  const start = event.startAt || event.date || event.endAt;
  if (event.dateOnly === true || !start) return formatDate(start);
  const startLabel = formatDate(start, true);
  if (!event.endAt) return startLabel;
  const endLabel = formatDate(event.endAt, true);
  return `${startLabel} - ${endLabel}`;
}

export function EventCard({ event }: EventCardProps) {
  const location = [event.city || event.citySlug, event.country || event.countryCode].filter(Boolean).join(', ');

  return (
    <Link to={`/event/${event.slug}`} className="group block">
      <Card className="overflow-hidden p-0 transition hover:-translate-y-1">
        <div className="h-44 w-full overflow-hidden bg-slate-100">
          <SafeImage src={event.image} alt={event.title} className="h-full w-full object-cover" fallbackClassName="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-500" />
        </div>
        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-3">
            <Badge className="text-sky-700 dark:text-sky-300">{event.category || 'Historical event'}</Badge>
            {event.verificationStatus === 'VERIFIED' ? <Badge className="text-emerald-700 dark:text-emerald-300">Verified</Badge> : event.verificationStatus === 'PARTIALLY_VERIFIED' ? <Badge className="text-amber-700 dark:text-amber-300">Partially verified</Badge> : event.verificationStatus === 'UNVERIFIED' ? <Badge className="text-slate-700 dark:text-slate-300">Unverified</Badge> : <span className="text-sm text-slate-500">{event.price || 'Catalog entry'}</span>}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{event.title}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{event.description || 'Historical event from the current catalog.'}</p>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            <p className="text-sky-700 dark:text-sky-300">{location || 'Regional catalog entry'}</p>
            {event.venue ? <p className="text-slate-600 dark:text-slate-400">{event.venue}</p> : null}
            <p className="text-slate-600 dark:text-slate-400">{formatEventDate(event)}</p>
            {event.sourceName ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Source: <span className="text-sky-700 dark:text-sky-300">{event.primarySourceName || event.sourceName}</span></p> : null}
            {event.verificationReason ? <p className="text-xs text-slate-500 dark:text-slate-400">{event.verificationReason}</p> : null}
            {event.lastCheckedAt ? <p className="text-xs text-slate-500 dark:text-slate-400">Checked: {formatDate(event.lastCheckedAt)}</p> : null}
          </div>
        </div>
      </Card>
    </Link>
  );
}
