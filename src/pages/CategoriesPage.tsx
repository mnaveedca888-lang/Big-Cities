import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { DataState } from '@/components/ui/data-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCategories } from '@/services/catalog';
import { useDebounce } from '@/hooks/useDebounce';

export default function CategoriesPage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query.trim(), 250);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('name');
  const categories = useQuery({
    queryKey: ['categories', debouncedQuery, page, sort],
    queryFn: () => getCategories({ q: debouncedQuery || undefined, page, perPage: 12, sort }),
    placeholderData: keepPreviousData,
  });
  const items = categories.data?.items ?? [];
  const pagination = categories.data?.pagination;
  const canGoBack = page > 1;
  const canGoNext = Boolean(pagination && page < pagination.totalPages);

  return (
    <>
      <Helmet>
        <title>Categories | Big Cities Event Monitor</title>
        <meta name="description" content="Browse curated categories spanning technology, education, business, and culture." />
      </Helmet>
      <div className="space-y-8">
        <div className="rounded-4xl border border-slate-200 bg-white/80 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Popular categories</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">Search and browse the catalog by category name and sort order.</p>
        </div>
        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 md:flex-row md:items-center md:justify-between">
          <Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search categories" className="max-w-md" />
          <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950">
            <option value="name">Sort by name</option>
            <option value="createdAt">Sort by created date</option>
          </select>
        </div>
        <DataState isLoading={categories.isLoading} error={categories.error ? 'Categories are unavailable right now.' : undefined} onRetry={() => void categories.refetch()} isEmpty={!categories.isLoading && items.length === 0} emptyTitle="No categories found" emptyDescription="Try a different search term or reset the filters.">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {items.map((category) => (
              <Link key={category.id} to={`/category/${category.slug}`}>
                <Card className="space-y-3 transition hover:-translate-y-1">
                  <div className="text-3xl">📚</div>
                  <h2 className="text-xl font-semibold text-slate-950 dark:text-white">{category.name}</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{category.description || 'A growing collection of events in this category.'}</p>
                  <p className="text-sm font-medium text-cyan-600">{category.count ?? 0} events</p>
                </Card>
              </Link>
            ))}
          </div>
          {pagination ? <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80"><span className="text-sm text-slate-500">Page {pagination.page} of {pagination.totalPages}</span><div className="flex gap-2"><Button type="button" variant="outline" disabled={!canGoBack} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</Button><Button type="button" variant="outline" disabled={!canGoNext} onClick={() => setPage((current) => current + 1)}>Next</Button></div></div> : null}
        </DataState>
      </div>
    </>
  );
}
