import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { DataState } from '@/components/ui/data-state';
import { Input } from '@/components/ui/input';
import { getContinents } from '@/services/catalog';

export default function ContinentsPage() {
  const [query, setQuery] = useState('');
  const continents = useQuery({ queryKey: ['continents'], queryFn: getContinents, placeholderData: keepPreviousData });
  const items = continents.data ?? [];
  const filteredContinents = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return search ? items.filter((continent) => continent.name.toLocaleLowerCase().includes(search)) : items;
  }, [items, query]);

  return (
    <>
      <Helmet>
        <title>Continents | Big Cities Event Monitor</title>
        <meta name="description" content="Explore continents and browse their countries from the global catalog." />
      </Helmet>
      <div className="space-y-8">
        <div className="rounded-4xl border border-slate-200 bg-white/80 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Explore Continents</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">Browse the continents in the catalog and continue to their countries.</p>
        </div>
        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:flex-row sm:items-center sm:justify-between">
          <Input
            aria-label="Search continents"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search continents by name"
            className="max-w-xl"
          />
          <span className="text-sm text-slate-500" aria-live="polite">{filteredContinents.length} continents</span>
        </div>
        <DataState
          isLoading={continents.isLoading}
          error={continents.error ? `Continents are unavailable right now. ${continents.error?.message ?? ''}` : undefined}
          onRetry={() => void continents.refetch()}
          isEmpty={!continents.isLoading && filteredContinents.length === 0}
          emptyTitle="No continents found"
          emptyDescription="Try another continent name or check back when the catalog is available."
        >
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {filteredContinents.map((continent) => (
              <Link key={continent.id} to={`/countries?continent=${encodeURIComponent(continent.name)}`} className="group">
                <Card className="h-full space-y-3 transition hover:-translate-y-1 hover:border-cyan-500 hover:shadow-md">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-600">Continent</p>
                  <h2 className="text-xl font-semibold text-slate-950 dark:text-white">{continent.name}</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{continent.countries ?? 0} countries</p>
                  <span className="inline-flex text-sm font-semibold text-cyan-600 group-hover:text-cyan-700 dark:text-cyan-400">Explore countries <span className="ml-1 transition group-hover:translate-x-0.5">→</span></span>
                </Card>
              </Link>
            ))}
          </div>
        </DataState>
      </div>
    </>
  );
}