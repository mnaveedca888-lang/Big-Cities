import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface AlertProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning';
  className?: string;
}

export function Alert({ children, variant = 'default', className }: AlertProps) {
  const base = 'rounded-2xl border px-4 py-3 text-sm';
  const variants = {
    default: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
    warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
  };

  return <div className={cn(base, variants[variant], className)} role="alert">{children}</div>;
}
