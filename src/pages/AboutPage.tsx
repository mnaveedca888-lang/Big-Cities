import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpenText, Building2, Compass, Globe2, MapPinned } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { getCities, getCountries } from '@/services/catalog';
import { getEvents } from '@/services/events';
import type { CityItem, CountryItem, EventItem } from '@/types';

const highlightCountryCodes = ['JP', 'IT', 'BR'];
const highlightCitySlugs = ['pk-lahore', 'pk-karachi', 'pk-faisalabad'];

function Metric({ value, label, isLoading }: { value?: number; label: string; isLoading: boolean }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-slate-950/25 px-4 py-3 backdrop-blur-sm">
      <p className="text-2xl font-semibold tabular-nums text-white">{isLoading ? '…' : (value ?? '—').toLocaleString()}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-200">{label}</p>
    </div>
  );
}

export default function AboutPage() {
  const countries = useQuery({
    queryKey: ['about-countries'],
    queryFn: () => getCountries({ page: 1, perPage: 500, sort: 'name' }),
    staleTime: 5 * 60_000,
  });
  const cities = useQuery({
    queryKey: ['about-cities'],
    queryFn: getCities,
    staleTime: 5 * 60_000,
  });
  const events = useQuery({
    queryKey: ['about-events'],
    queryFn: () => getEvents({ country: 'JP', perPage: 100 }),
    staleTime: 5 * 60_000,
  });

  const countryItems = countries.data?.items ?? [];
  const cityItems = cities.data ?? [];
  const eventItems = events.data ?? [];
  const featuredCountries = highlightCountryCodes
    .map((code) => countryItems.find((country) => country.code === code))
    .filter((country): country is CountryItem => Boolean(country));
  const featuredCities = highlightCitySlugs
    .map((slug) => cityItems.find((city) => city.slug === slug))
    .filter((city): city is CityItem => Boolean(city));
  const sampleEvent = eventItems.find((event) => event.title && event.countryCode === 'JP' && /Historical\/cultural significance:/i.test(event.description || ''));
  const dataError = countries.error || cities.error || events.error;

  return (
    <>
      <Helmet>
        <title>About | Big Cities Information</title>
        <meta name="description" content="Explore country profiles, city information, and historical event entries from the Big Cities Information catalog." />
      </Helmet>

      <div className="space-y-12 pb-10">
        <section aria-labelledby="about-heading" className="overflow-hidden rounded-[2rem] border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 shadow-xl">
          <div className="grid min-h-[440px] items-end gap-10 p-6 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center lg:p-14">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-200/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
                <Compass className="h-3.5 w-3.5" /> A guide to places and their stories
              </span>
              <h1 id="about-heading" className="mt-6 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">Explore the world, one place at a time.</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">Big Cities Information brings country profiles, city details, and historical event entries together so you can follow a place from its wider context to local stories.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/countries" className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Explore countries <ArrowRight className="h-4 w-4" /></Link>
                <Link to="/cities" className="inline-flex h-11 items-center gap-2 rounded-full border border-white/35 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Browse big cities</Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:max-w-sm lg:w-72">
              <Metric value={countries.data?.pagination.total} label="Countries" isLoading={countries.isLoading} />
              <Metric value={cityItems.length} label="Listed cities" isLoading={cities.isLoading} />
            </div>
          </div>
        </section>

        {dataError ? (
          <div role="status" className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            <p>Some live catalog details could not be loaded. You can still explore the directories.</p>
            <button type="button" onClick={() => { void countries.refetch(); void cities.refetch(); void events.refetch(); }} className="w-fit rounded-full border border-current px-3 py-1.5 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600">Retry</button>
          </div>
        ) : null}

        <section aria-labelledby="about-platform-heading" className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300">A place-first directory</p>
            <h2 id="about-platform-heading" className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">Start with a country. Keep exploring.</h2>
          </div>
          <div className="space-y-4 text-base leading-7 text-slate-600 dark:text-slate-300">
            <p>Choose a country to see its available profile, linked city pages, and events associated with that country. From there, city pages bring together the local profile fields and event entries available in the catalog.</p>
            <p>Coverage varies by place and by record. Profiles can have missing details, and event entries may have different levels of source and verification information. The site presents the information currently in its catalog rather than promising complete coverage.</p>
          </div>
        </section>

        <section aria-labelledby="explore-heading">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300">Explore the catalog</p>
              <h2 id="explore-heading" className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white sm:text-3xl">Three ways into a place</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="flex h-full flex-col border-slate-200/80 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/70">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300"><Globe2 className="h-5 w-5" /></span>
              <h3 className="mt-5 text-lg font-semibold text-slate-950 dark:text-white">Country profiles</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-400">Browse the country directory, filter by continent, and open country pages for profile information, cities, and linked events.</p>
              <Link to="/countries" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-800 hover:text-cyan-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:text-cyan-300">Open country directory <ArrowRight className="h-4 w-4" /></Link>
            </Card>
            <Card className="flex h-full flex-col border-slate-200/80 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/70">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"><Building2 className="h-5 w-5" /></span>
              <h3 className="mt-5 text-lg font-semibold text-slate-950 dark:text-white">City information</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-400">Search the listed city catalog and follow city pages for the available local history, culture, geography, and event details.</p>
              <Link to="/cities" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-800 hover:text-cyan-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:text-cyan-300">Open city directory <ArrowRight className="h-4 w-4" /></Link>
            </Card>
            <Card className="flex h-full flex-col border-slate-200/80 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/70">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"><BookOpenText className="h-5 w-5" /></span>
              <h3 className="mt-5 text-lg font-semibold text-slate-950 dark:text-white">Historical events</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-400">Country and city pages show event entries linked to those places. Source and verification details vary by record, so check the entry itself for context.</p>
              {sampleEvent ? <Link to={`/event/${sampleEvent.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-800 hover:text-cyan-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:text-cyan-300">View a catalog event <ArrowRight className="h-4 w-4" /></Link> : <Link to="/countries" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-800 hover:text-cyan-600 dark:text-cyan-300">Browse country pages <ArrowRight className="h-4 w-4" /></Link>}
            </Card>
          </div>
        </section>

        <section aria-labelledby="examples-heading" className="rounded-[2rem] border border-slate-200 bg-slate-50/80 p-6 dark:border-slate-800 dark:bg-slate-900/40 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300">A few starting points</p>
              <h2 id="examples-heading" className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Choose a destination</h2>
            </div>
            <Link to="/countries" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-cyan-700 dark:text-slate-200 dark:hover:text-cyan-300">See all countries <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100"><MapPinned className="h-4 w-4 text-cyan-700 dark:text-cyan-300" /> Countries in the live catalog</h3>
              {countries.isLoading ? <p className="mt-3 text-sm text-slate-500" role="status">Loading country links…</p> : countries.error ? <p className="mt-3 text-sm text-slate-500">Country examples are unavailable right now. The directory remains available.</p> : featuredCountries.length ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {featuredCountries.map((country) => <Link key={country.code} to={`/country/${country.code}`} className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-cyan-400 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-slate-800 dark:bg-slate-950"><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{country.continent ?? 'Country'}</span><span className="mt-1 block font-semibold text-slate-950 dark:text-white">{country.name}</span></Link>)}
                </div>
              ) : <p className="mt-3 text-sm text-slate-500">No country examples are available.</p>}
            </div>
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100"><Building2 className="h-4 w-4 text-indigo-700 dark:text-indigo-300" /> Cities in the listed catalog</h3>
              {cities.isLoading ? <p className="mt-3 text-sm text-slate-500" role="status">Loading city links…</p> : cities.error ? <p className="mt-3 text-sm text-slate-500">City examples are unavailable right now. The directory remains available.</p> : featuredCities.length ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {featuredCities.map((city) => <Link key={city.slug} to={`/city/${city.slug}`} className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-cyan-400 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-slate-800 dark:bg-slate-950"><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{city.countryCode ?? 'City'}</span><span className="mt-1 block font-semibold text-slate-950 dark:text-white">{city.name}</span></Link>)}
                </div>
              ) : <p className="mt-3 text-sm text-slate-500">No city examples are available.</p>}
            </div>
          </div>
        </section>

        <section aria-label="Continue exploring" className="flex flex-col gap-5 rounded-[2rem] bg-slate-950 px-6 py-8 text-white sm:flex-row sm:items-center sm:justify-between sm:px-9">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Your next stop</p>
            <h2 className="mt-2 text-2xl font-semibold">Find a place that interests you.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Search the available country and city directories, then follow the links into each place’s details.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link to="/countries" className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Browse countries <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/cities" aria-label="Browse big cities" className="inline-flex h-11 items-center justify-center rounded-full border border-white/30 px-5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Browse cities</Link>
          </div>
        </section>
      </div>
    </>
  );
}
