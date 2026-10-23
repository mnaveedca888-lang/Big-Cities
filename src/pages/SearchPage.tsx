import { Helmet } from 'react-helmet-async';
import { Search } from 'lucide-react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useSearchParams } from 'react-router-dom';
import { searchEvents } from '@/services/search';
import { DataState } from '@/components/ui/data-state';
import { EventCard } from '@/components/features/EventCard';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/useDebounce';

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const debouncedQuery = useDebounce(query.trim(), 250);
  const page = Number(params.get('page') ?? '1');
  const category = params.get('category') ?? '';
  const [savedSearches, setSavedSearches] = useState<string[]>(() => JSON.parse(window.localStorage.getItem('saved-searches') ?? '[]') as string[]);
  useEffect(() => { setQuery(params.get('q') ?? ''); }, [params]);
  const results = useQuery({
    queryKey: ['search', debouncedQuery, category, page],
    queryFn: ({ signal }) => searchEvents({ query: debouncedQuery, page, pageSize: 12, category: category || undefined }, signal),
    enabled: debouncedQuery.length > 1,
    placeholderData: keepPreviousData,
  });
  const submitSearch = (event: React.FormEvent) => { event.preventDefault(); const next = new URLSearchParams(params); query.trim() ? next.set('q', query.trim()) : next.delete('q'); next.set('page', '1'); setParams(next); };
  return (
    <>
      <Helmet>
        <title>Search | Big Cities Event Monitor</title>
        <meta name="description" content="Search events instantly with suggestions, recent activity, and optimized discovery." />
      </Helmet>
      <div className="space-y-8">
        <div className="rounded-4xl border border-slate-200 bg-white/80 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Instant search</h1>
          <form onSubmit={submitSearch} className="mt-6 flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
            <Search className="h-4 w-4 text-slate-500" />
            <Input aria-label="Search events" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search AI events, cities, organizers" className="h-8 min-w-0 border-0 bg-transparent px-0 shadow-none" />
          </form>
        </div>
        {query ? <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap"><Input aria-label="Filter by category" value={category} onChange={(event) => { const next = new URLSearchParams(params); event.target.value ? next.set('category', event.target.value) : next.delete('category'); next.set('page', '1'); setParams(next); }} placeholder="Category filter" className="w-full max-w-xs" /><Button type="button" variant="outline" onClick={() => { const next = Array.from(new Set([...savedSearches, query])); setSavedSearches(next); window.localStorage.setItem('saved-searches', JSON.stringify(next)); }}>Save search</Button></div> : null}
        {query ? <DataState isLoading={results.isLoading} error={results.error ? 'Search is unavailable right now.' : undefined} isEmpty={results.isSuccess && results.data.events.length === 0} onRetry={() => void results.refetch()}><div className="space-y-6"><div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{results.data?.events.map((event) => <EventCard key={event.id} event={event} />)}</div><div className="flex justify-center gap-3"><Button type="button" variant="outline" disabled={page <= 1} onClick={() => { const next = new URLSearchParams(params); next.set('page', String(page - 1)); setParams(next); }}>Previous</Button><span className="py-2 text-sm">Page {page}</span><Button type="button" variant="outline" disabled={!results.data || results.data.events.length < 12} onClick={() => { const next = new URLSearchParams(params); next.set('page', String(page + 1)); setParams(next); }}>Next</Button></div></div></DataState> : null}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Recent searches</h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">AI Summit, London, Startup, Healthcare</p>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Popular searches</h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Responsible AI, Festival, ML, Open Source</p>
          </Card>
        </div>
      </div>
    </>
  );
}
