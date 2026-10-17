import { ReactNode } from 'react';

interface TableProps {
  headers: string[];
  rows: ReactNode[];
}

export function Table({ headers, rows }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 shadow-sm dark:border-slate-800">
      <table className="min-w-[640px] divide-y divide-slate-200 text-sm dark:divide-slate-800">
        <thead className="bg-slate-50 dark:bg-slate-900/70">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white/80 dark:divide-slate-800 dark:bg-slate-950/70">
          {rows.map((row, index) => (
            <tr key={index}>{row}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
