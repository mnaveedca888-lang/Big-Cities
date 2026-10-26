import { ReactNode } from 'react';

interface SectionProps {
  title: ReactNode;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}

export function Section({ title, description, children, action }: SectionProps) {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h2>
          {description ? <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">{description}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
