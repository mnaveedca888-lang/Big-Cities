import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State { return { hasError: true }; }

  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Application error', error, info); }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <div className="max-w-md space-y-4 rounded-4xl border border-slate-200 bg-white/80 p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/80" role="alert" aria-live="assertive">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-600">Error</p>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Something went wrong</h1>
          <p className="text-slate-600 dark:text-slate-400">We could not load this page. Please try again or return home.</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">Retry</button>
            <Link to="/" className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">Go home</Link>
          </div>
        </div>
      </main>
    );
  }
}
