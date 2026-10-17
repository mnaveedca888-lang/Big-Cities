import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
}

export function Modal({ open, onClose, children, title, className }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
      <div className={cn('w-full max-w-lg rounded-4xl border border-slate-200 bg-white/95 p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900/95 sm:p-6', className)}>
        <div className="flex items-start justify-between gap-3">
          {title ? <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h2> : null}
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-950 dark:hover:text-white">Close</button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
