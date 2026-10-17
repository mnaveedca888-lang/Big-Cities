import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Filter, List, Map, Search } from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DataState } from '@/components/ui/data-state';
import { EventCard } from '@/components/features/EventCard';
import { getEvents } from '@/services/events';
import { filterHiddenCategories, isCategoryHiddenByUi } from '@/services/catalog';
import type { EventItem } from '@/types';

type ViewMode = 'list' | 'map';

function getEventCoordinates(event: EventItem) {
  const description = event.description || '';
  const coordinateMatch = description.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  if (coordinateMatch) {
    return { lat: Number(coordinateMatch[1]), lng: Number(coordinateMatch[2]) };
  }

  const city = (event.city || event.citySlug || '').toLowerCase();
  const coordinatesByCity: Record<string, { lat: number; lng: number }> = {
    lahore: { lat: 31.5497, lng: 74.3436 },
    karachi: { lat: 24.8607, lng: 67.0011 },
    islamabad: { lat: 33.6844, lng: 73.0479 },
    rawalpindi: { lat: 33.5651, lng: 73.0169 },
    peshawar: { lat: 34.0151, lng: 71.5249 },
    quetta: { lat: 30.1798, lng: 66.9750 },
    multan: { lat: 30.1978, lng: 71.4697 },
    faisalabad: { lat: 31.4187, lng: 73.0791 },
    sialkot: { lat: 32.4932, lng: 74.5314 },
  };

  return coordinatesByCity[city] ?? null;
}

function buildFilterSummary(events: EventItem[]) {
  const categories = Array.from(new Set(events.map((event) => event.category).filter(Boolean))).filter((category) => !isCategoryHiddenByUi(category)) as string[];
  const countries = Array.from(new Set(events.map((event) => event.country || event.countryCode).filter(Boolean))) as string[];
  const cities = Array.from(new Set(events.map((event) => event.city || event.citySlug).filter(Boolean))) as string[];
  return { categories, countries, cities };
}

const markerIcon = new L.DivIcon({
  className: 'event-marker-icon',
  html: '<span class="block h-3.5 w-3.5 rounded-full border-2 border-white bg-cyan-400 shadow-lg"></span>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function EventsMapView({ events }: { events: EventItem[] }) {
  const points = events.map((event) => ({ event, coordinates: getEventCoordinates(event) })).filter((item) => item.coordinates);

  if (points.length === 0) {
    return (
      <div className="flex min-h-[24rem] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
        No map markers are available for the current results.
      </div>
    );
  }

  return (
    <div className="h-[30rem] w-full overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800">
      <MapContainer center={[30.3753, 69.3451]} zoom={5} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map(({ event, coordinates }) => (
          <Marker key={event.id} position={[coordinates!.lat, coordinates!.lng]} icon={markerIcon}>
            <Popup>
              <div className="space-y-2">
                <p className="font-semibold text-slate-950 dark:text-slate-100">{event.title}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{event.city || event.citySlug || 'Regional'} • {event.country || event.countryCode || 'Catalog'}</p>
                <a href={`/event/${event.slug}`} className="text-sm font-medium text-cyan-600 hover:underline dark:text-cyan-400">Open event</a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default function EventsPage() {
  const [view, setView] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const eventsQuery = useQuery({
    queryKey: ['events-list', search, category, country, city],
    queryFn: () => getEvents({ q: search || undefined, category: category || undefined, country: country || undefined, city: city || undefined, perPage: 100 }),
    refetchOnMount: 'always',
  });

  const events = useMemo(() => (Array.isArray(eventsQuery.data) ? eventsQuery.data.filter((event) => !isCategoryHiddenByUi(event.category)) : []), [eventsQuery.data]);

  const countriesQuery = useQuery({
    queryKey: ['countries-list'],
    queryFn: () => getCountries({ perPage: 300 }),
    refetchOnMount: false,
  });
  const catalogCountries = filterHiddenCategories(countriesQuery.data?.items ?? []);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const selectedCountryName = (catalogCountries.find((c) => c.code === country)?.name || '').toLowerCase();
    return events.filter((event) => {
      const haystack = [event.title, event.description, event.country, event.countryCode, event.city, event.citySlug, event.category].filter(Boolean).join(' ').toLowerCase();
      const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);
      const matchesCategory = !category || (event.category || '').toLowerCase() === category.toLowerCase();
      const eventCountryCode = (event.countryCode || '').toLowerCase();
      const eventCountryName = (event.country || '').toLowerCase();
      const matchesCountry = !country || eventCountryCode === country.toLowerCase() || eventCountryName === selectedCountryName;
      const matchesCity = !city || (event.city || event.citySlug || '').toLowerCase() === city.toLowerCase();
      return matchesSearch && matchesCategory && matchesCountry && matchesCity;
    });
  }, [events, search, category, country, city, catalogCountries]);

  const filterSummary = useMemo(() => buildFilterSummary(events), [events]);

  return (
    <>
      <Helmet>
        <title>Events | Big Cities Event Monitor</title>
        <meta name="description" content="Browse global events with advanced filtering, map and list views, and event discovery tools." />
      </Helmet>
      <div className="space-y-8">
        <div className="rounded-4xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Global events</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Search, filter, and discover leading events with premium list and map experiences.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setShowFilters((value) => !value)}><Filter className="mr-2 h-4 w-4" /> Filters</Button>
              <Button variant={view === 'list' ? 'default' : 'outline'} onClick={() => setView('list')}><List className="mr-2 h-4 w-4" /> List</Button>
              <Button variant={view === 'map' ? 'default' : 'outline'} onClick={() => setView('map')}><Map className="mr-2 h-4 w-4" /> Map</Button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 lg:flex-row">
            <label className="flex flex-1 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-950">
              <Search className="h-4 w-4 text-slate-500" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search events, cities, organizers" className="h-8 min-w-0 border-0 bg-transparent px-0 shadow-none" />
            </label>
            <Button onClick={() => { void eventsQuery.refetch(); }}>Search</Button>
          </div>

          {showFilters ? (
            <div className="mt-4 grid gap-3 rounded-3xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/70 md:grid-cols-3">
              <label className="text-sm text-slate-600 dark:text-slate-400">
                <span className="mb-1 block">Category</span>
                <select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                  <option value="">All categories</option>
                  {filterSummary.categories.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label className="text-sm text-slate-600 dark:text-slate-400">
                <span className="mb-1 block">Country</span>
                <select value={country} onChange={(event) => setCountry(event.target.value)} className="w-full rounded-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                  <option value="">All countries</option>
                  {catalogCountries.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-600 dark:text-slate-400">
                <span className="mb-1 block">City</span>
                <select value={city} onChange={(event) => setCity(event.target.value)} className="w-full rounded-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                  <option value="">All cities</option>
                  {filterSummary.cities.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>{filteredEvents.length} events</span>
            {search ? <Badge>{search}</Badge> : null}
            {category ? <Badge>{category}</Badge> : null}
            {country ? <Badge>{country}</Badge> : null}
            {city ? <Badge>{city}</Badge> : null}
            {(search || category || country || city) ? <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setCategory(''); setCountry(''); setCity(''); }}>Clear</Button> : null}
          </div>
        </div>

        <DataState isLoading={eventsQuery.isLoading} error={eventsQuery.error ? 'Events are unavailable right now.' : undefined} onRetry={() => { void eventsQuery.refetch(); }} isEmpty={!eventsQuery.isLoading && filteredEvents.length === 0} emptyTitle="No events found" emptyDescription="Try adjusting your search or filters to view more events.">
          {view === 'map' ? (
            <Card className="overflow-hidden p-0">
              <div className="p-4">
                <EventsMapView events={filteredEvents} />
              </div>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </DataState>
      </div>
    </>
  );
}

