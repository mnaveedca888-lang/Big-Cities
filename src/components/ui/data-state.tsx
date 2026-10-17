import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';

interface DataStateProps {
  isLoading?: boolean;
  error?: string;
  isEmpty?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  children: ReactNode;
}

export function DataState({ isLoading, error, isEmpty, onRetry, emptyTitle = 'Nothing here yet', emptyDescription = 'There is no data to display.', children }: DataStateProps) {
  if (isLoading) return <div className="grid min-h-40 place-items-center rounded-2xl border border-slate-200 bg-slate-50/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70" role="status" aria-live="polite"><Spinner /></div>;
  if (error) return <Alert variant="warning" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="space-y-1"><p className="font-medium">Something went wrong</p><p>{error}</p></div>{onRetry ? <Button type="button" size="sm" variant="outline" onClick={onRetry}>Retry</Button> : null}</Alert>;
  if (isEmpty) return <EmptyState title={emptyTitle} description={emptyDescription} />;
  return <>{children}</>;
}
