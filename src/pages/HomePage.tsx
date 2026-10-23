import { Helmet } from 'react-helmet-async';
import { Globe2, CalendarDays, Users, ShieldCheck, Building2, Tags, Plane } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Section } from '@/components/ui/section';
import { DataState } from '@/components/ui/data-state';
import { Card } from '@/components/ui/card';
import { EventCard } from '@/components/features/EventCard';
import { apiClient } from '@/api/client';
import { getCategories, getContinents, getCountryCities, getCountryDirectory, getVerifiedCityCount } from '@/services/catalog';
import { getEvents, getFeaturedEvents } from '@/services/events';
import type { EventItem } from '@/types';
import type { CategoryItem, CityItem, ContinentItem, CountryItem } from '@/types';
import heroBannerHtml from '../../images/Banner for Home page.html?url';

export default function HomePage() {
  const [continent, setContinent] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');

  const continentsQuery = useQuery({ queryKey: ['home-continents'], queryFn: getContinents });
  const countriesQuery = useQuery({ queryKey: ['home-countries', continent], queryFn: () => getCountryDirectory({ continent, perPage: 500 }), enabled: Boolean(continent) });
  const citiesQuery = useQuery({ queryKey: ['home-cities', country], queryFn: () => getCountryCities(country), enabled: Boolean(country) });
  const featuredEventsQuery = useQuery({ queryKey: ['home-featured-events'], queryFn: getFeaturedEvents });
  const locationEventsQuery = useQuery({
    queryKey: ['home-location-events', continent, country, city],
    queryFn: () => getEvents({ country, city, exactCity: true, perPage: 100 }),
    enabled: Boolean(city),
  });

  const statsQuery = useQuery({
    queryKey: ['home-platform-counts'],
    queryFn: async () => {
      const [countriesResponse, citiesResponse, eventsResponse, categoriesResponse] = await Promise.all([
        getCountryDirectory({ page: 1, perPage: 1 }),
        getVerifiedCityCount(),
        apiClient.get('/events', { params: { page: 1, perPage: 1 } }),
        getCategories({ page: 1, perPage: 1 }),
      ]);

      const countries = Number(countriesResponse?.pagination?.total ?? 0);
      const cities = Number(citiesResponse ?? 0);
      const events = Number(eventsResponse.data?.data?.pagination?.total ?? 0);
      const categories = Number(categoriesResponse?.pagination?.total ?? 0);

      return { countries, cities, events, categories };
    },
  });

  const countries = countriesQuery.data?.items ?? [];
  const cities = citiesQuery.data ?? [];
  const featuredEvents = useMemo(() => Array.isArray(featuredEventsQuery.data) ? featuredEventsQuery.data : [], [featuredEventsQuery.data]);
  const locationEvents = useMemo(() => {
    return Array.isArray(locationEventsQuery.data) ? locationEventsQuery.data : [];
  }, [locationEventsQuery.data]);

  const selectedCountryName = countries.find((item: CountryItem) => item.code === country)?.name ?? country;
  const selectedCityName = cities.find((item: CityItem) => item.slug === city)?.name ?? city;
  const selectedCountryCount = countriesQuery.data?.pagination?.total ?? countries.length;
  const selectedCityCount = cities.length;
  const selectedEventCount = locationEvents.length;

  const locationHeroCount = city
    ? (locationEventsQuery.isLoading ? `${selectedCityName} · Loading Events...` : `${selectedCityName} · ${selectedEventCount} ${selectedEventCount === 1 ? 'Event' : 'Events'}`)
    : country
      ? (citiesQuery.isLoading ? `${selectedCountryName} · Loading Cities...` : `${selectedCountryName} · ${selectedCityCount} ${selectedCityCount === 1 ? 'City' : 'Cities'}`)
      : continent
        ? (countriesQuery.isLoading ? `${continent} · Loading Countries...` : `${continent} · ${selectedCountryCount} ${selectedCountryCount === 1 ? 'Country' : 'Countries'}`)
        : 'Explore by Location & Events';

  return (
    <>
      <Helmet>
        <title>Big Cities Event Monitor</title>
        <meta name="description" content="Discover major cities, event highlights, and global activity through a premium city-focused monitoring experience." />
      </Helmet>

      <div className="space-y-12 pb-16">
        <section aria-label="Big Cities banner" className="home-banner relative rounded-4xl border border-slate-200 bg-slate-100 shadow-xl dark:border-slate-800 dark:bg-slate-950">
          <iframe src={heroBannerHtml} title="Big Cities Information" scrolling="no" className="block h-full w-full border-0" />
        </section>

        <section className="home-info-card relative overflow-hidden rounded-4xl border border-slate-200 bg-white/80 p-8 shadow-xl backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 lg:p-12">
          <span className="absolute left-0 top-0 h-full w-1 rounded-l-4xl bg-linear-to-b from-cyan-500 to-sky-500" aria-hidden="true" />
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white/70 text-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-cyan-300">
              <Building2 className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-3">
                <span className="h-px w-10 bg-cyan-500/60" aria-hidden="true" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300">Big City</span>
              </div>
              <h2 className="text-3xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                What is a Big City?
              </h2>
              <p className="mt-4 max-w-5xl text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
                <span className="font-semibold text-cyan-700 dark:text-cyan-300">A Big City</span> is a large, crowded place where lots of people live and work, filled with tall buildings, busy streets and public spaces. It acts as a main hub for its region, and because it has an <span className="font-semibold text-cyan-700 dark:text-cyan-300">International Airport</span>, it connects its people and businesses directly to the rest of the world.
              </p>
            </div>
            <span className="ml-auto hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-cyan-300 md:flex">
              <Plane className="h-5 w-5" />
            </span>
          </div>
        </section>

        <section className="rounded-4xl border border-slate-200 bg-white/80 p-8 shadow-xl backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 lg:p-12">
          <div className="space-y-6">
            <Badge className="w-fit border border-slate-200 bg-slate-100 text-sky-700 dark:border-slate-700 dark:bg-slate-800 dark:text-sky-300">Continent · Countries · Cities · Events</Badge>
            <div className="mt-6 space-y-5">
              <h1 className="max-w-2xl bg-linear-to-r from-slate-700 via-sky-700 to-cyan-700 bg-clip-text text-4xl font-semibold leading-[1.05] tracking-tight text-transparent sm:text-6xl lg:text-7xl dark:from-slate-200 dark:via-sky-200 dark:to-cyan-200">
                Explore Countries. Discover Cities. Experience Events.
              </h1>
              <p className="max-w-xl border-l-2 border-sky-500/60 pl-4 text-base leading-7 text-slate-600 sm:text-lg dark:border-sky-300/60 dark:text-slate-300">
                Explore countries and major cities, discover their culture, history, landmarks, and tourism, and stay updated with current and upcoming events happening around the world.
              </p>
            </div>

            <div className="mt-8">
              <section className="rounded-4xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-8">
                <div className="flex flex-col gap-2">
                  <h2 className="bg-linear-to-r from-slate-700 via-teal-700 to-cyan-700 bg-clip-text text-2xl font-semibold text-transparent dark:from-slate-200 dark:via-teal-200 dark:to-cyan-200">Explore by Location &amp; Events</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Follow the cascade from continent to country and city.</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-sky-300">
                      {locationHeroCount}
                    </span>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    <span className="mb-2 block">Continent</span>
                    <select value={continent} onChange={(event) => { setContinent(event.target.value); setCountry(''); setCity(''); }} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                      <option value="">Select Continent</option>
                      {(continentsQuery.data ?? []).map((item: ContinentItem) => <option key={item.id} value={item.name}>{item.name}</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    <span className="mb-2 block">Country</span>
                    <select value={country} disabled={!continent || countriesQuery.isLoading} onChange={(event) => { setCountry(event.target.value); setCity(''); }} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none disabled:cursor-not-allowed disabled:opacity-50 focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                      <option value="">{!continent ? 'Select a continent first' : countriesQuery.isLoading ? 'Loading countries...' : 'Select Country'}</option>
                      {countries.map((item: CountryItem) => <option key={item.code} value={item.code}>{item.name}</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    <span className="mb-2 block">City</span>
                    <select value={city} disabled={!country || citiesQuery.isLoading} onChange={(event) => { setCity(event.target.value); }} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none disabled:cursor-not-allowed disabled:opacity-50 focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                      <option value="">{!country ? 'Select a country first' : citiesQuery.isLoading ? 'Loading cities...' : cities.length ? 'Select City' : 'No cities available'}</option>
                      {cities.map((item: CityItem) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
                    </select>
                  </label>
                </div>
                {!country && !city && continent ? (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Countries in {continent}</h3>
                    {countriesQuery.isLoading ? (
                      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading countries...</p>
                    ) : countries.length ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {countries.map((item: CountryItem) => (
                          <Link key={item.code} to={`/country/${item.code}`} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-500 hover:text-cyan-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-300">
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No countries available.</p>
                    )}
                  </div>
                ) : null}
                {country && !city ? (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Cities in {countries.find((item) => item.code === country)?.name || country}</h3>
                    {citiesQuery.isLoading ? (
                      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading cities...</p>
                    ) : cities.length ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {cities.map((item: CityItem) => (
                          <Link key={item.slug} to={`/city/${item.slug}`} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-500 hover:text-cyan-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-300">
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No cities available.</p>
                    )}
                  </div>
                ) : null}
                {city ? (
                  <DataState isLoading={locationEventsQuery.isLoading} error={locationEventsQuery.error ? 'Events are unavailable right now.' : undefined} onRetry={() => { void locationEventsQuery.refetch(); }} isEmpty={!locationEventsQuery.isLoading && locationEvents.length === 0} emptyTitle="No events found for this location" emptyDescription="Try another country, city, or event category.">
                    <div className="mt-6">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{locationEvents.length} events found{city ? ` in ${cities.find((item) => item.slug === city)?.name || city}` : country ? ` in ${countries.find((item) => item.code === country)?.name || country}` : ` across ${continent}`}</p>
                      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {locationEvents.map((event: EventItem) => <EventCard key={event.id} event={event} />)}
                      </div>
                    </div>
                  </DataState>
                ) : (!country && !city && !continent ? (
                  <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-400">
                    Select a continent to load countries.
                  </div>
                ) : !country && !city ? (
                  <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-400">
                    Select a country to load cities.
                  </div>
                ) : null)}
              </section>
            </div>
          </div>
        </section>


        <Section title={<span className="bg-linear-to-r from-slate-700 via-teal-700 to-cyan-700 bg-clip-text text-transparent dark:from-slate-200 dark:via-teal-200 dark:to-cyan-200">Featured events</span>} description="The most upcoming events from around the world.">
          <DataState
            isLoading={featuredEventsQuery.isLoading}
            error={featuredEventsQuery.error ? 'Featured events are unavailable right now.' : undefined}
            onRetry={() => { void featuredEventsQuery.refetch(); }}
            isEmpty={!featuredEventsQuery.isLoading && featuredEvents.length === 0}
            emptyTitle="No featured events found"
            emptyDescription="Check back soon for the next upcoming events."
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredEvents.map((event) => <EventCard key={event.id} event={event} />)}
            </div>
          </DataState>
        </Section>

        <Section title={<span className="bg-linear-to-r from-slate-700 via-teal-700 to-cyan-700 bg-clip-text text-transparent dark:from-slate-200 dark:via-teal-200 dark:to-cyan-200">Why explore Big Cities Event Monitor</span>}>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { title: 'Discover Countries', description: 'Explore countries around the world and discover their capitals, cities, culture, history, landmarks, tourism, and current events.', icon: Globe2 },
              { title: 'Explore Major Cities', description: 'Discover detailed city information including history, landmarks, museums, food, culture, transportation, tourism, sports, and more.', icon: Building2 },
              { title: 'Find Live & Upcoming Events', description: 'Discover current and upcoming events across cities, including concerts, sports, exhibitions, festivals, conferences, theatre, technology, government events, and other activities.', icon: CalendarDays },
            ].map((item) => (
              <Card key={item.title} className="space-y-3">
                <item.icon className="h-6 w-6 text-cyan-600" />
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{item.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
              </Card>
            ))}
          </div>
        </Section>

        <Section title={<span className="bg-linear-to-r from-slate-700 via-teal-700 to-cyan-700 bg-clip-text text-transparent dark:from-slate-200 dark:via-teal-200 dark:to-cyan-200">Explore the World. Discover What’s Happening.</span>} description="Explore countries and major cities, discover their information and attractions, and stay updated with current and upcoming events from verified sources.">
          <DataState
            isLoading={statsQuery.isLoading}
            error={statsQuery.error ? 'Project statistics are unavailable right now.' : undefined}
            onRetry={() => { void statsQuery.refetch(); }}
            isEmpty={!statsQuery.isLoading && !statsQuery.data}
            emptyTitle="Project statistics unavailable"
            emptyDescription="The catalog statistics endpoint did not return counts."
          >
            <div className="grid gap-6 md:grid-cols-4">
              {statsQuery.data ? [
                { label: 'Countries', value: String(statsQuery.data.countries), icon: Globe2 },
                { label: 'Cities', value: String(statsQuery.data.cities), icon: Building2 },
                { label: 'Events', value: String(statsQuery.data.events), icon: CalendarDays },
                { label: 'Categories', value: String(statsQuery.data.categories), icon: Tags },
              ].map((stat) => (
                <Card key={stat.label} className="text-center">
                  <stat.icon className="mx-auto h-7 w-7 text-cyan-600" />
                  <p className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">{stat.value}</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
                </Card>
              )) : null}
            </div>
          </DataState>
        </Section>
      </div>
    </>
  );
}
