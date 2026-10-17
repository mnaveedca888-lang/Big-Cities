import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { DataState } from '@/components/ui/data-state';
import { getCategory } from '@/services/catalog';
import { Button } from '@/components/ui/button';

export default function CategoryDetailPage() {
  const { slug = '' } = useParams();
  const category = useQuery({ queryKey: ['category', slug], queryFn: () => getCategory(slug), enabled: Boolean(slug) });

  return (
    <>
      <Helmet>
        <title>Category Details | Big Cities Event Monitor</title>
        <meta name="description" content="Explore a specific category and the event themes it represents." />
      </Helmet>
      <div className="space-y-8">
        <div className="rounded-4xl border border-slate-200 bg-white/80 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">{category.data?.name ?? 'Category'}</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">{category.data?.description || 'A curated category from the catalog API.'}</p>
        </div>
        <DataState isLoading={category.isLoading} error={category.error ? 'Category details are unavailable right now.' : undefined} onRetry={() => void category.refetch()} isEmpty={!category.isLoading && !category.data} emptyTitle="Category not found" emptyDescription="This category does not exist in the current catalog.">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Category overview</h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">This page is backed by the live categories endpoint and reflects the current catalog data from the backend.</p>
            </Card>
            <Card className="space-y-3">
              <p className="text-sm text-slate-500">Slug</p>
              <p className="text-lg font-semibold text-slate-950 dark:text-white">{category.data?.slug}</p>
              <p className="text-sm text-slate-500">Events</p>
              <p className="text-lg font-semibold text-slate-950 dark:text-white">{category.data?.count ?? 0}</p>
              <Link to="/categories">
                <Button variant="outline" className="w-full">Back to categories</Button>
              </Link>
            </Card>
          </div>
        </DataState>
      </div>
    </>
  );
}

