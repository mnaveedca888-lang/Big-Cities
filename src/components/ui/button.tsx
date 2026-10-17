import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

const variantClasses = {
  default: 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-cyan-500 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200',
  outline: 'border border-slate-300 bg-white/90 text-slate-900 hover:bg-slate-50 focus-visible:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-800',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-cyan-500 dark:text-slate-200 dark:hover:bg-slate-800',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-cyan-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
};

const sizeClasses = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-60',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';
