import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DataState } from '@/components/ui/data-state';
import { Input } from '@/components/ui/input';
import { getBigCityDisplayName, getBigCityDisplayNameSearchAliases, getBigCityDisplayNameSearchExclusions } from '@/data/bigCitiesAirportDisplayNames';
import { getCityDirectory } from '@/services/catalog';

const PAGE_SIZE = 12;

export default function BigCitiesPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [query]);
  const cityDirectoryQuery = useQuery({
    queryKey: ['city-directory', debouncedQuery, page],
    queryFn: () => getCityDirectory({
      q: debouncedQuery || undefined,
      page,
      perPage: PAGE_SIZE,
      aliasSlugs: getBigCityDisplayNameSearchAliases(debouncedQuery),
      excludeSlugs: getBigCityDisplayNameSearchExclusions(debouncedQuery),
    }),
    placeholderData: keepPreviousData,
  });
  const cities = cityDirectoryQuery.data?.items ?? [];
  const pagination = cityDirectoryQuery.data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const totalCitiesLabel = `${(pagination?.total ?? 0).toLocaleString()} cities`;

  return (
    <>
      <Helmet>
        <title>Big Cities | Big Cities Event Monitor</title>
        <meta name="description" content="Browse and search cities from the global city catalog." />
      </Helmet>
      <div className="space-y-8">
        <div className="rounded-4xl border border-slate-200 bg-white/80 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Big Cities</h1>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{totalCitiesLabel}</span>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <Input
            aria-label="Search cities"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            placeholder="Search city..."
            className="max-w-2xl"
          />
        </div>
        <DataState
          isLoading={cityDirectoryQuery.isLoading}
          error={cityDirectoryQuery.error ? `Cities are unavailable right now. ${cityDirectoryQuery.error.message}` : undefined}
          onRetry={() => void cityDirectoryQuery.refetch()}
          isEmpty={!cityDirectoryQuery.isLoading && cities.length === 0}
          emptyTitle="No cities found"
          emptyDescription="Try another city name or check back when more cities are available."
        >
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cities.map((city) => (
              <li key={city.slug} className="h-full">
                <Link to={`/city/${city.slug}`} className="block h-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-500 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-300">
                  {getBigCityDisplayName(city.slug, city.name)}
                </Link>
              </li>
            ))}
          </ul>
          {totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
              <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</Button>
                <Button type="button" variant="outline" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</Button>
              </div>
            </div>
          ) : null}
        </DataState>
      </div>
    </>
  );
}