import { createContext, useContext, useState } from 'react';

interface ToastMessage {
  id: number;
  title: string;
  description?: string;
}

const ToastContext = createContext<((message: ToastMessage) => void) | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = (message: ToastMessage) => {
    const id = Date.now();
    setToasts((current) => [...current, { ...message, id }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={pushToast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg dark:border-slate-800 dark:bg-slate-950/95">
            <p className="font-medium text-slate-950 dark:text-white">{toast.title}</p>
            {toast.description ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{toast.description}</p> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
