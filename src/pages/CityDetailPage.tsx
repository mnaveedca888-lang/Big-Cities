import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { DataState } from '@/components/ui/data-state';
import { SafeImage } from '@/components/ui/safe-image';
import { getBigCityDisplayName } from '@/data/bigCitiesAirportDisplayNames';
import { getCity } from '@/services/catalog';
import { getEvents } from '@/services/events';
import { buildCanonicalCityProfile } from '@/utils/cityProfile';
import { formatAreaValue } from '@/utils/format';
import { getPakistanCityImage } from '@/utils/pakistanImages';

function getCityImage(city: { image?: string | null; profile?: Record<string, unknown> | null } | null | undefined) {
  const profile = (city?.profile as Record<string, unknown> | null | undefined) ?? null;
  return city?.image ?? (typeof profile?.heroImageUrl === 'string' ? profile.heroImageUrl : null) ?? (typeof profile?.thumbnail === 'string' ? profile.thumbnail : null);
}

function formatValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(', ');
  }
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  return String(value);
}

function extractHistoricalDateFromDescription(description?: string | null) {
  if (!description) return '';
  const match = description.match(/Document date:\s*(.+?)(?:\n|$)/i);
  return match?.[1]?.trim() || '';
}

function formatHistoricalDateLabel(event: { description?: string | null; date?: string | null; dateText?: string | null; startAt?: string | null }) {
  const descriptionDate = extractHistoricalDateFromDescription(event?.description);
  if (descriptionDate) return descriptionDate;
  if (event?.dateText) return String(event.dateText);
  if (event?.date) return new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  if (event?.startAt) return new Date(event.startAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return 'Date TBD';
}

export default function CityDetailPage() {
  const { slug = '' } = useParams();
  const normalizedSlug = slug.trim();
  const city = useQuery({ queryKey: ['city', normalizedSlug], queryFn: () => getCity(normalizedSlug), enabled: Boolean(normalizedSlug), refetchOnMount: 'always' });
  const events = useQuery({ queryKey: ['events', normalizedSlug], queryFn: () => getEvents({ city: normalizedSlug }), enabled: Boolean(normalizedSlug), refetchOnMount: 'always' });
  const profile = buildCanonicalCityProfile((city.data?.profile as Record<string, unknown> | null | undefined) ?? null);
  const localPakistanCityImage = getPakistanCityImage(normalizedSlug);
  const heroImage = getCityImage(city.data) ?? localPakistanCityImage;
  if (import.meta.env.DEV) {
    console.log('CityDetailPage image selection', {
      slug: normalizedSlug,
      heroImage,
      apiCityImage: city.data?.image,
      profileHeroImage: city.data?.profile?.heroImageUrl,
      profileThumbnail: city.data?.profile?.thumbnail,
      localPakistanCityImage,
      cityData: city.data,
    });
  }
  if (import.meta.env.DEV) {
    console.log('CityDetailPage image values', { slug: normalizedSlug, heroImage, cityData: city.data, localPakistanCityImage });
  }
  const cityName = (city.data?.countryCode?.trim().toUpperCase() === 'AZ'
    ? getBigCityDisplayName(normalizedSlug, city.data.name ?? normalizedSlug)
    : city.data?.name ?? normalizedSlug) || 'City';
  const hasProfile = Boolean(city.data);

  const cityEvents = useMemo(() => {
    const eventList = Array.isArray(events.data) ? events.data : [];
    return eventList;
  }, [events.data]);

  const upcomingEvents = useMemo(() => {
    if (!cityEvents.length) return [];
    const now = Date.now();
    return cityEvents.filter((event: any) => {
      const eventDate = new Date(event.startAt ?? event.date ?? '').getTime();
      return Number.isFinite(eventDate) && eventDate >= now;
    });
  }, [cityEvents]);

  return (
    <>
      <Helmet>
        <title>{`${cityName} details | Big Cities Event Monitor`}</title>
        <meta name="description" content={`Discover city-level history, culture, transportation, and upcoming events for ${cityName}.`} />
      </Helmet>
      <div className="space-y-8">
        <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white/80 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="h-72 w-full overflow-hidden bg-slate-100 sm:h-80 lg:h-96 dark:bg-slate-950">
            <SafeImage src={heroImage} alt={cityName} className="h-full w-full" fallbackClassName="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-500" />
          </div>
          <div className="p-8">
            <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">{cityName}</h1>
            <p className="mt-3 text-slate-600 dark:text-slate-400">{profile?.shortDescription ? String(profile.shortDescription) : city.data?.countryCode ? `Country code ${city.data.countryCode}` : 'A local hub for regional discovery.'}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">{formatValue(profile?.country ?? (city.data?.countryCode ? `Country code ${city.data.countryCode}` : 'Profile coming soon'))}</span>
              <span className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">Population: {formatValue(profile?.population ?? city.data?.population)}</span>
              <span className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">Nickname: {formatValue(profile?.nickname)}</span>
            </div>
          </div>
        </div>
        <DataState isLoading={city.isLoading || events.isLoading} error={city.error || events.error ? 'City details are unavailable right now.' : undefined} onRetry={() => { void city.refetch(); void events.refetch(); }} isEmpty={!city.isLoading && !city.data && !events.isLoading} emptyTitle="City not found" emptyDescription="This city is not present in the current catalog.">
          {!hasProfile ? (
            <Card>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">City profile coming soon</h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Detailed information for {cityName} will be added soon. Until then, the page shows the city summary and any upcoming events.</p>
            </Card>
          ) : (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">About</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <p><span className="font-semibold text-slate-950 dark:text-white">Overview:</span> {formatValue(profile?.overview)}</p>
                <p><span className="font-semibold text-slate-950 dark:text-white">History:</span> {formatValue(profile?.history)}</p>
                <p><span className="font-semibold text-slate-950 dark:text-white">Founded:</span> {formatValue(profile?.founded)}</p>
                <p><span className="font-semibold text-slate-950 dark:text-white">Historical significance:</span> {formatValue(profile?.historicalSignificance)}</p>
              </div>
            </Card>
            <Card>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Geography</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <p><span className="font-semibold text-slate-950 dark:text-white">Area:</span> {formatAreaValue(profile?.area)}</p>
                <p><span className="font-semibold text-slate-950 dark:text-white">Elevation:</span> {formatValue(profile?.elevation)}</p>
                <p><span className="font-semibold text-slate-950 dark:text-white">Rivers:</span> {formatValue(profile?.rivers)}</p>
                <p><span className="font-semibold text-slate-950 dark:text-white">Climate:</span> {formatValue(profile?.climate)}</p>
                <p><span className="font-semibold text-slate-950 dark:text-white">Coordinates:</span> {formatValue(profile?.coordinates)}</p>
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Tourism</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <p><span className="font-semibold text-slate-950 dark:text-white">UNESCO sites:</span> {formatValue(profile?.unescoSites)}</p>
                <p><span className="font-semibold text-slate-950 dark:text-white">Famous landmarks:</span> {formatValue(profile?.famousLandmarks)}</p>
                <p><span className="font-semibold text-slate-950 dark:text-white">Museums:</span> {formatValue(profile?.museums)}</p>
                <p><span className="font-semibold text-slate-950 dark:text-white">Parks:</span> {formatValue(profile?.parks)}</p>
              </div>
            </Card>
            <Card>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Food</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <p><span className="font-semibold text-slate-950 dark:text-white">Traditional food:</span> {formatValue(profile?.traditionalFood)}</p>
                <p><span className="font-semibold text-slate-950 dark:text-white">Street food:</span> {formatValue(profile?.streetFood)}</p>
                <p><span className="font-semibold text-slate-950 dark:text-white">Popular restaurants:</span> {formatValue(profile?.popularRestaurants)}</p>
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Culture</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <p><span className="font-semibold text-slate-950 dark:text-white">Festivals:</span> {formatValue(profile?.festivals)}</p>
                <p><span className="font-semibold text-slate-950 dark:text-white">Cultural events:</span> {formatValue(profile?.culturalEvents)}</p>
                <p><span className="font-semibold text-slate-950 dark:text-white">Arts:</span> {formatValue(profile?.arts)}</p>
                <p><span className="font-semibold text-slate-950 dark:text-white">Music:</span> {formatValue(profile?.music)}</p>
              </div>
            </Card>
            <Card>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Economy</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <p><span className="font-semibold text-slate-950 dark:text-white">Major industries:</span> {formatValue(profile?.majorIndustries)}</p>
                <p><span className="font-semibold text-slate-950 dark:text-white">Technology:</span> {formatValue(profile?.technology)}</p>
                <p><span className="font-semibold text-slate-950 dark:text-white">Tourism:</span> {formatValue(profile?.tourism)}</p>
                <p><span className="font-semibold text-slate-950 dark:text-white">Manufacturing:</span> {formatValue(profile?.manufacturing)}</p>
                <p><span className="font-semibold text-slate-950 dark:text-white">Finance:</span> {formatValue(profile?.finance)}</p>
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Transportation</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <p><span className="font-semibold text-slate-950 dark:text-white">Metro:</span> {formatValue(profile?.metro)}</p>
                <p><span className="font-semibold text-slate-950 dark:text-white">Airport:</span> {formatValue(profile?.airport)}</p>
                <p><span className="font-semibold text-slate-950 dark:text-white">Railway:</span> {formatValue(profile?.railway)}</p>
                <p><span className="font-semibold text-slate-950 dark:text-white">Bus network:</span> {formatValue(profile?.busNetwork)}</p>
                <p><span className="font-semibold text-slate-950 dark:text-white">Major roads:</span> {formatValue(profile?.majorRoads)}</p>
              </div>
            </Card>
            <Card>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Entertainment</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <p><span className="font-semibold text-slate-950 dark:text-white">Movies filmed here:</span> {formatValue(profile?.moviesFilmedHere)}</p>
                <p><span className="font-semibold text-slate-950 dark:text-white">TV shows:</span> {formatValue(profile?.tvShows)}</p>
                <p><span className="font-semibold text-slate-950 dark:text-white">Sports:</span> {formatValue(profile?.sports)}</p>
                <p><span className="font-semibold text-slate-950 dark:text-white">Stadiums:</span> {formatValue(profile?.stadiums)}</p>
              </div>
            </Card>
          </div>

          <Card>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Famous people</h2>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">{formatValue(profile?.famousPeople)}</p>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Fun facts</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400"><span className="font-semibold text-slate-950 dark:text-white">Nickname:</span> {formatValue(profile?.nickname)}</div>
              <div className="rounded-2xl border border-slate-200 p-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400"><span className="font-semibold text-slate-950 dark:text-white">World records:</span> {formatValue(profile?.worldRecords)}</div>
              <div className="rounded-2xl border border-slate-200 p-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400"><span className="font-semibold text-slate-950 dark:text-white">Interesting facts:</span> {formatValue(profile?.interestingFacts)}</div>
              <div className="rounded-2xl border border-slate-200 p-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400"><span className="font-semibold text-slate-950 dark:text-white">Unique customs:</span> {formatValue(profile?.uniqueCustoms)}</div>
              <div className="rounded-2xl border border-slate-200 p-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400"><span className="font-semibold text-slate-950 dark:text-white">Unique transportation:</span> {formatValue(profile?.uniqueTransportation)}</div>
              <div className="rounded-2xl border border-slate-200 p-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400"><span className="font-semibold text-slate-950 dark:text-white">Surprising facts:</span> {formatValue(profile?.surprisingFacts)}</div>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Statistics</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400"><span className="font-semibold text-slate-950 dark:text-white">Population:</span> {formatValue(profile?.population)}</div>
              <div className="rounded-2xl border border-slate-200 p-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400"><span className="font-semibold text-slate-950 dark:text-white">Area:</span> {formatAreaValue(profile?.area)}</div>
              <div className="rounded-2xl border border-slate-200 p-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400"><span className="font-semibold text-slate-950 dark:text-white">Elevation:</span> {formatValue(profile?.elevation)}</div>
              <div className="rounded-2xl border border-slate-200 p-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400"><span className="font-semibold text-slate-950 dark:text-white">Time zone:</span> {formatValue(profile?.timeZone)}</div>
              <div className="rounded-2xl border border-slate-200 p-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400"><span className="font-semibold text-slate-950 dark:text-white">Postal code:</span> {formatValue(profile?.postalCode)}</div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Events for {cityName}</h2>
              <span className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">{cityEvents.length}</span>
            </div>
            {cityEvents.length > 0 ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {cityEvents.map((event: any) => {
                  const eventDate = new Date(event.startAt ?? event.date ?? '').getTime();
                  const isUpcoming = Number.isFinite(eventDate) && eventDate >= Date.now();
                  return (
                    <Link key={event.id} to={`/event/${event.slug}`} className="rounded-2xl border border-slate-200 p-3 text-sm text-slate-600 transition hover:border-cyan-500 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-950">
                      <div className="font-semibold text-slate-950 dark:text-white">{event.title}</div>
                      <div className="mt-2">{formatHistoricalDateLabel(event)}</div>
                      <div className="mt-2 text-xs uppercase tracking-[0.24em] text-cyan-600">{isUpcoming ? 'Upcoming' : 'Scheduled'}</div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">No events are linked to this city yet.</p>
            )}
          </Card>
            </>
          )}
        </DataState>
      </div>
    </>
  );
}

