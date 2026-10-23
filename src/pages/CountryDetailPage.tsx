import { Helmet } from 'react-helmet-async';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { DataState } from '@/components/ui/data-state';
import { prefetchCityPage, prefetchEventPage } from '@/services/routePrefetch';
import { getBigCityDisplayName } from '@/data/bigCitiesAirportDisplayNames';
import { getCategories, getCountry, getCountryCities } from '@/services/catalog';
import { getEvents } from '@/services/events';import { buildCanonicalCountryProfile } from '@/utils/countryProfile';import { pakistanCountryImage } from '@/utils/pakistanImages';
import { formatAreaValue } from '@/utils/format';
import { SafeImage } from '@/components/ui/safe-image';
import { DailyEventsSection, isHistoricalCatalogEvent } from '@/components/features/DailyEventsSection';
import type { EventItem } from '@/types';

function formatValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(', ');
  }
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  return String(value);
}

function getEventDateValue(event: { startAt?: string | null; endAt?: string | null; date?: string | null }) {
  const parsedEnd = event?.endAt ? new Date(event.endAt) : null;
  if (parsedEnd && !Number.isNaN(parsedEnd.getTime())) return parsedEnd;

  const parsedStart = event?.startAt ? new Date(event.startAt) : null;
  if (parsedStart && !Number.isNaN(parsedStart.getTime())) return parsedStart;

  const parsedDate = event?.date ? new Date(event.date) : null;
  if (parsedDate && !Number.isNaN(parsedDate.getTime())) return parsedDate;

  return null;
}

function getNextUpcomingEvent(events: Array<{ title?: string | null; startAt?: string | null; endAt?: string | null; date?: string | null }>) {
  if (!Array.isArray(events) || events.length === 0) return null;

  const today = new Date();

  const upcomingEntries = events
    .map((event) => {
      const candidateDate = event?.startAt ? new Date(event.startAt) : event?.date ? new Date(event.date) : null;
      if (!candidateDate) return null;
      if (Number.isNaN(candidateDate.getTime()) || candidateDate < today) return null;
      return { event, date: candidateDate };
    })
    .filter((entry): entry is { event: { title?: string | null; startAt?: string | null; endAt?: string | null; date?: string | null }; date: Date } => Boolean(entry));

  if (upcomingEntries.length === 0) return null;

  return upcomingEntries.sort((a, b) => a.date.getTime() - b.date.getTime())[0];
}

function formatTickerDate(value: Date) {
  return new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(value);
}

const excludedEventTitles = new Set(['basant traditional kite festival', 'pakistan independence day heritage celebrations', 'jashn e baharan basant', 'jashn e baharan']);

function normalizeTitle(value: string) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function dedupeEvents(events: Array<any>) {
  const seen = new Set<string>();
  return events.filter((event) => {
    const title = String(event?.title ?? '');
    const normalizedTitle = normalizeTitle(title);
    if (excludedEventTitles.has(normalizedTitle)) return false;
    const dateValue = getEventDateValue(event);
    const dateKey = dateValue ? dateValue.toISOString().slice(0, 10) : 'no-date';
    const key = `${normalizedTitle}::${dateKey}`;
    if (!normalizedTitle) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function filterCountryEvents(events: Array<{ countryCode?: string | null } | undefined | null> | undefined, countryCode: string) {
  if (!Array.isArray(events)) return [];
  const normalizedCountryCode = countryCode.trim().toUpperCase();
  return events.filter((event) => {
    const eventCountryCode = typeof event?.countryCode === 'string' ? event.countryCode.trim().toUpperCase() : '';
    return eventCountryCode === normalizedCountryCode;
  });
}

export default function CountryDetailPage() {
  const queryClient = useQueryClient();
  const { code = '' } = useParams();
  const normalizedCode = code.trim().toUpperCase();
  const country = useQuery({ queryKey: ['country', normalizedCode], queryFn: () => getCountry(normalizedCode), enabled: Boolean(normalizedCode) });
  const cities = useQuery({ queryKey: ['country-cities', normalizedCode], queryFn: () => getCountryCities(normalizedCode), enabled: Boolean(normalizedCode) });
  const events = useQuery({ queryKey: ['country-events', normalizedCode], queryFn: () => getEvents({ country: normalizedCode, perPage: 100 }), enabled: Boolean(normalizedCode) });
  const isPakistanDailyEventsQuery = normalizedCode === 'PK';
  const dailyEvents = useQuery({
    queryKey: ['country-daily-events', normalizedCode],
    queryFn: () => getEvents({ country: normalizedCode, perPage: 100, dailyOnly: true }),
    enabled: isPakistanDailyEventsQuery,
    refetchInterval: isPakistanDailyEventsQuery ? 30_000 : false,
    refetchIntervalInBackground: false,
    staleTime: 15_000,
  });
  const categories = useQuery({ queryKey: ['event-categories'], queryFn: () => getCategories({ perPage: 100 }), enabled: normalizedCode === 'PK' });
  const profile = (country.data?.profile as Record<string, unknown> | null | undefined) ?? null;
  const canonicalProfile = buildCanonicalCountryProfile(profile);
  const countryName = (country.data?.name ?? normalizedCode) || 'Country';
  const hasProfile = Boolean(profile && Object.keys(profile).length > 0);
  const isPakistanCountry = normalizedCode === 'PK';
  const apiCountryImage = typeof country.data?.image === 'string' && country.data.image.trim() ? country.data.image.trim() : null;
  const apiCountryFlag = typeof country.data?.flagImage === 'string' && country.data.flagImage.trim() ? country.data.flagImage.trim() : null;
  const profileHeroImage = typeof profile?.heroImageUrl === 'string' && profile.heroImageUrl.trim() ? profile.heroImageUrl.trim() : null;
  const profileFlagImage = typeof profile?.flagImageUrl === 'string' && profile.flagImageUrl.trim() ? profile.flagImageUrl.trim() : null;
  const heroImage = profileHeroImage ?? apiCountryImage ?? (isPakistanCountry ? pakistanCountryImage : null);
  const flagImage = profileFlagImage ?? apiCountryFlag;
  const cityList = Array.isArray(cities.data) ? cities.data : [];

  if (import.meta.env.DEV) {
    console.log('CountryDetailPage image selection', {
      apiCountryImage,
      apiCountryFlag,
      heroImage,
      flagImage,
      countryData: country.data,
      countryProfileHero: profile?.heroImageUrl,
      profileFlag: profile?.flagImageUrl,
    });
  }

  if (import.meta.env.DEV) {
    console.log('CountryDetailPage image values', {
      apiCountryImage,
      apiCountryFlag,
      heroImage,
      flagImage,
      profileHeroImage: profile?.heroImageUrl,
      countryData: country.data,
    });
  }
  const countryEvents = filterCountryEvents((events.data as Array<{ title?: string | null; description?: string | null; sourceName?: string | null; sourceUrl?: string | null; startAt?: string | null; endAt?: string | null; date?: string | null; countryCode?: string | null }> | undefined) ?? [], normalizedCode);
  const now = new Date();
  const historicalEvents = countryEvents.filter((event) => {
    const date = getEventDateValue(event);
    return isHistoricalCatalogEvent(event as EventItem) || (date ? date < now : false);
  });
  const currentOrUpcomingEvents = countryEvents.filter((event) => {
    const date = getEventDateValue(event);
    return !isHistoricalCatalogEvent(event as EventItem) && (date ? date >= now : false);
  });
  const dedupedEvents = dedupeEvents(historicalEvents);
  const introDescription = isPakistanCountry && profile?.shortDescription === 'Pakistan is a South Asian country with an estimated population of 259.5 million and Islamabad as its capital.'
    ? 'Pakistan is renowned for its breathtaking mountain ranges, ancient civilizations, and vibrant cultural traditions.'
    : canonicalProfile.shortDescription ? String(canonicalProfile.shortDescription) : country.data?.continent ? `${country.data.continent} region` : 'A region with curated event activity.';
  const profileFactEntries = [
    { title: 'Overview', value: canonicalProfile.overview },
    { title: 'Geography', value: canonicalProfile.geography },
    { title: 'Economy', value: canonicalProfile.economy },
    { title: 'Government', value: canonicalProfile.government },
    { title: 'Capital', value: canonicalProfile.capital },
    { title: 'Population', value: canonicalProfile.population },
    { title: 'Area', value: formatAreaValue(canonicalProfile.area) },
    { title: 'Currency', value: canonicalProfile.currency },
    { title: 'Historical significance', value: canonicalProfile.historicalSignificance },
    { title: 'Important historical events', value: canonicalProfile.importantHistoricalEvents },
    { title: 'Famous landmarks', value: canonicalProfile.famousLandmarks },
    { title: 'Tourist attractions', value: canonicalProfile.touristAttractions },
    { title: 'Airports', value: canonicalProfile.airports },
    { title: 'Railways', value: canonicalProfile.railways },
  ].filter((entry) => {
    const value = entry.value;
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    return String(value).trim() !== '';
  });
  const upcomingEvent = getNextUpcomingEvent(countryEvents);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysRemaining = upcomingEvent
    ? Math.max(0, Math.ceil((new Date(upcomingEvent.date.getFullYear(), upcomingEvent.date.getMonth(), upcomingEvent.date.getDate()).getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <>
      <Helmet>
        <title>{`${countryName} details | Big Cities Event Monitor`}</title>
        <meta name="description" content={`View ${countryName} country detail, city highlights, and curated regional information.`} />
      </Helmet>
      <div className="space-y-8">
        <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white/80 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="h-72 w-full overflow-hidden bg-slate-100 sm:h-80 lg:h-96 dark:bg-slate-950">
            <SafeImage src={heroImage} fallbackSrc={isPakistanCountry ? pakistanCountryImage : null} alt={country.data?.name ?? 'Country'} loading="eager" fetchPriority="high" className="h-full w-full" fallbackClassName="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-500" />
          </div>
          <div className="p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="mt-4 shrink-0">
                    <SafeImage src={flagImage} alt={`${countryName} flag`} className="h-8 w-12 rounded border border-slate-200 object-contain object-center" fallbackClassName="flex h-8 w-12 items-center justify-center rounded border border-slate-200 bg-slate-100 text-[10px] text-slate-500" />
                  </div>
                  <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">{countryName}</h1>
                </div>
                <p className="text-slate-600 dark:text-slate-400">{introDescription}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
                {[
                  { label: 'Capital', value: formatValue(canonicalProfile.capital) },
                  { label: 'Population', value: formatValue(canonicalProfile.population) },
                ].map((item, index) => (
                  <Card key={item.label} className="text-center transition duration-300 hover:-translate-y-1 hover:shadow-md" style={{ animationDelay: `${index * 100}ms` }}>
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{item.value}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
        <DataState isLoading={country.isLoading || cities.isLoading || events.isLoading} error={country.error || cities.error || events.error ? 'Country details are unavailable right now.' : undefined} onRetry={() => { void country.refetch(); void cities.refetch(); void events.refetch(); }} isEmpty={!country.isLoading && !country.data && !cities.isLoading && !events.isLoading} emptyTitle="Country not found" emptyDescription="This country is not present in the current catalog.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Continent', value: country.data?.continent ?? 'Global', accent: 'from-cyan-500/15 to-cyan-500/5' },
              { label: 'Big Cities', value: cities.data?.length ?? 0, accent: 'from-emerald-500/15 to-emerald-500/5' },
              { label: 'Area', value: formatAreaValue(canonicalProfile.area), accent: 'from-violet-500/15 to-violet-500/5' },
              { label: 'Currency', value: formatValue(canonicalProfile.currency), accent: 'from-amber-500/15 to-amber-500/5' },
            ].map((item, index) => (
              <Card key={item.label} className="group overflow-hidden border border-slate-200/80 text-center transition duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800" style={{ animationDelay: `${index * 100}ms` }}>
                <div className={`rounded-t-2xl bg-gradient-to-r ${item.accent} px-3 py-2`} />
                <div className="p-4">
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-950 transition duration-300 group-hover:text-cyan-700 dark:text-white dark:group-hover:text-cyan-400">{item.value}</p>
                </div>
              </Card>
            ))}
          </div>

          <Card>
            {!hasProfile ? (
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">About {countryName}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Detailed information for {countryName} will be added soon. Until then, this page shows the country summary and available city links.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm transition duration-300 hover:shadow-md dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                      <h3 className="text-lg font-semibold text-slate-950 dark:text-white">About {countryName}</h3>
                    </div>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      {profileFactEntries.map((item, index) => (
                        <div key={item.title} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70" style={{ animationDelay: `${index * 80}ms` }}>
                          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-600">{item.title}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{formatValue(item.value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="w-full max-w-[440px] self-start">
                    <div className="group overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100 shadow-sm transition duration-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950">
                      <SafeImage src={heroImage} fallbackSrc={isPakistanCountry ? pakistanCountryImage : null} alt={`${countryName} landscape`} className="h-64 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-72" fallbackClassName="flex h-64 w-full items-center justify-center bg-slate-100 text-sm text-slate-500 sm:h-72" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <div className="my-10 overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/80 px-4 py-4 shadow-[0_22px_70px_rgba(14,165,233,0.08)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/40 dark:shadow-[0_22px_70px_rgba(15,23,42,0.22)]">
            <div className="mx-auto h-2 w-full max-w-4xl rounded-full bg-gradient-to-r from-cyan-500 via-slate-300 to-cyan-500 opacity-90 shadow-[0_0_24px_rgba(34,211,238,0.22)]" />
          </div>

          <Card className="overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/80 shadow-[0_22px_70px_rgba(14,165,233,0.08)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/40 dark:shadow-[0_22px_70px_rgba(15,23,42,0.22)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Big Cities in {countryName}</h2>
            </div>
            {cityList.length > 0 ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {cityList.map((city: { slug?: string; name?: string }) => {
                  const slug = city.slug ?? '';
                  const displayName = normalizedCode === 'AZ'
                    ? getBigCityDisplayName(slug, city.name ?? '')
                    : city.name;
                  return (
                    <Link
                      key={slug || city.name}
                      to={`/city/${slug}`}
                      onMouseEnter={() => void prefetchCityPage(queryClient, slug)}
                      onFocus={() => void prefetchCityPage(queryClient, slug)}
                      className="group flex min-h-[72px] items-center rounded-3xl border border-slate-200 bg-white/70 p-4 text-lg font-semibold text-slate-950 shadow-sm transition hover:-translate-y-1 hover:border-cyan-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70 dark:text-white"
                    >
                      {displayName}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">No cities are currently linked to this country.</p>
            )}
          </Card>

          <div className="my-10 overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/80 px-4 py-4 shadow-[0_22px_70px_rgba(14,165,233,0.08)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/40 dark:shadow-[0_22px_70px_rgba(15,23,42,0.22)]">
            <div className="mx-auto h-2 w-full max-w-4xl rounded-full bg-gradient-to-r from-cyan-500 via-slate-300 to-cyan-500 opacity-90 shadow-[0_0_24px_rgba(34,211,238,0.22)]" />
          </div>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Historical events in {countryName}</h2>
            </div>
            {dedupedEvents.length > 0 ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {dedupedEvents.map((event: any) => (
                  <Link
                    key={event.id}
                    to={`/event/${event.slug}`}
                    onMouseEnter={() => void prefetchEventPage(queryClient, event.slug)}
                    onFocus={() => void prefetchEventPage(queryClient, event.slug)}
                    className="group flex min-h-[72px] items-center rounded-3xl border border-slate-200 bg-white/70 p-4 text-lg font-semibold text-slate-950 shadow-sm transition hover:-translate-y-1 hover:border-cyan-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70 dark:text-white"
                  >
                    {event.title}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">No live events are currently linked to this country.</p>
            )}
          </Card>

          <div className="my-10 overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/80 px-4 py-4 shadow-[0_22px_70px_rgba(14,165,233,0.08)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/40 dark:shadow-[0_22px_70px_rgba(15,23,42,0.22)]">
            <div className="mx-auto h-2 w-full max-w-4xl rounded-full bg-gradient-to-r from-cyan-500 via-slate-300 to-cyan-500 opacity-90 shadow-[0_0_24px_rgba(34,211,238,0.22)]" />
          </div>

          {isPakistanCountry ? (
            <DailyEventsSection
              events={(dailyEvents.data as EventItem[]) ?? []}
              categories={categories.data?.items ?? []}
              isLoading={dailyEvents.isLoading || categories.isLoading}
              error={categories.error ? 'Daily event categories are unavailable right now.' : undefined}
              onRetry={() => { void dailyEvents.refetch(); void categories.refetch(); }}
            />
          ) : null}

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-cyan-200/70 bg-gradient-to-r from-cyan-600/10 via-slate-50 to-cyan-500/10 px-4 py-3 shadow-[0_0_30px_rgba(6,182,212,0.08)] backdrop-blur-sm dark:border-cyan-500/20 dark:from-cyan-500/10 dark:via-slate-900 dark:to-cyan-500/10 sm:px-6">
            <div className="relative overflow-hidden rounded-[1.1rem] border border-white/70 bg-white/70 px-4 py-3 dark:border-slate-800/70 dark:bg-slate-950/70">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white/80 to-transparent dark:from-slate-950/80" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white/80 to-transparent dark:from-slate-950/80" />
              <div className="flex min-w-0 items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                <span className="shrink-0 rounded-full bg-cyan-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white">Live</span>
                {upcomingEvent ? (
                  <div className="marquee-container flex-1 min-w-0 overflow-hidden">
                    <div
                      className="marquee-track"
                      data-text={`Upcoming Event: ${upcomingEvent.event.title} — ${formatTickerDate(upcomingEvent.date)} | Only ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining!`}
                    >
                      Upcoming Event: {upcomingEvent.event.title} — {formatTickerDate(upcomingEvent.date)} | Only {daysRemaining} day{daysRemaining === 1 ? '' : 's'} remaining!
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-600 dark:text-slate-400">No upcoming events at the moment. Please check back soon.</span>
                )}
              </div>
            </div>
          </div>

        </DataState>
      </div>
    </>
  );
}
