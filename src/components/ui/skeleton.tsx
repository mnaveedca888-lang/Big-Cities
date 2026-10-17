import { cn } from '@/utils/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/70', className)} role="status" aria-label="Loading content" />;
}
