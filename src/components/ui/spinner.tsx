export function Spinner({ className = '' }: { className?: string }) {
  return <div aria-label="Loading" className={`h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-white ${className}`} />;
}
