import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { DataState } from '@/components/ui/data-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getContinents, getCountries } from '@/services/catalog';

export default function CountriesPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const continent = searchParams.get('continent') ?? '';
  const continents = useQuery({ queryKey: ['continents'], queryFn: getContinents, keepPreviousData: true });
  const countries = useQuery({ queryKey: ['countries', query, continent, page], queryFn: () => getCountries({ q: query || undefined, continent: continent || undefined, page, perPage: 12, sort: 'name' }), keepPreviousData: true });
  const items = countries.data?.items ?? [];
  const pagination = countries.data?.pagination;

  return (
    <>
      <Helmet>
        <title>Countries | Big Cities Event Monitor</title>
        <meta name="description" content="Explores countries and regional event volume for global discovery." />
      </Helmet>
      <div className="space-y-8">
        <div className="rounded-4xl border border-slate-200 bg-white/80 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Discover Countries & Their Cities</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">Browse countries worldwide, explore their biggest cities, uncover fascinating facts, and discover local events and experiences.</p>
        </div>
        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 md:flex-row md:items-center md:justify-between">
          <Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search countries" className="max-w-md" />
          <select aria-label="Filter countries by continent" value={continent} onChange={(event) => {
            const value = event.target.value;
            setSearchParams((current) => {
              const next = new URLSearchParams(current);
              if (value) next.set('continent', value);
              else next.delete('continent');
              return next;
            });
            setPage(1);
          }} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950">
            <option value="">All continents</option>
            {(continents.data ?? []).map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
          </select>
        </div>
        <DataState isLoading={countries.isLoading} error={countries.error ? `Countries are unavailable right now. ${countries.error?.message ?? ''}` : undefined} onRetry={() => void countries.refetch()} isEmpty={!countries.isLoading && items.length === 0} emptyTitle="No countries found" emptyDescription="Try adjusting the search or continent filter.">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {items.map((country) => (
              <Link key={country.code} to={`/country/${country.code}`}>
                <Card className="space-y-3 transition hover:-translate-y-1">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-600">{country.code}</p>
                  <h2 className="text-xl font-semibold text-slate-950 dark:text-white">{country.name}</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{country.continent ?? 'Global'}</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{country.events ?? 0} events</p>
                </Card>
              </Link>
            ))}
          </div>
          {pagination ? <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80"><span className="text-sm text-slate-500">Page {pagination.page} of {pagination.totalPages}</span><div className="flex gap-2"><Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</Button><Button type="button" variant="outline" disabled={page >= (pagination.totalPages || 1)} onClick={() => setPage((current) => current + 1)}>Next</Button></div></div> : null}
        </DataState>
      </div>
    </>
  );
}

