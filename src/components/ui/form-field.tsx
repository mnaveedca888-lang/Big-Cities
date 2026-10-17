import type { ReactNode } from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}

export function FormField({ id, label, error, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label>
      {children}
      {error ? <p id={`${id}-error`} role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
