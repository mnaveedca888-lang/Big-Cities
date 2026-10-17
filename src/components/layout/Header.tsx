import type React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, Moon, Search, Sun, Globe2, Menu, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/contexts/ThemeContext';
import { apiBaseUrl } from '@/config/runtime';
import { useAuth } from '@/contexts/AuthContext';
import { siteConfig } from '@/config/site';
import { useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { getCountries } from '@/services/catalog';
import type { CountryItem } from '@/types';

const logoImage = `${apiBaseUrl}/images/Logo_design_for_Big_Cities_202608061337_11zon.webp`;

export function Header() {
  const { resolvedTheme, setMode } = useTheme();
  const { isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<CountryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 350);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) {
      setResults([]);
      setError(null);
      setOpen(false);
      setIsLoading(false);
      return;
    }

    let ignore = false;
    setIsLoading(true);
    setError(null);
    setOpen(true);

    void getCountries({ q: trimmed, page: 1, perPage: 50, sort: 'name' })
      .then((data) => {
        if (!ignore) {
          setResults(data.items ?? []);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const message = err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string'
            ? (err as { message: string }).message
            : 'Country search is temporarily unavailable.';
          setError(message);
          setResults([]);
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [debouncedQuery]);

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      setOpen(false);
      navigate('/countries');
    }
  }

  function handleSelect(path: string) {
    setOpen(false);
    setQuery('');
    navigate(path);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80 dark:shadow-slate-950/30">
      <div className="relative z-10 mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={logoImage}
            alt="Big Cities Event Monitor logo"
            className="h-10 w-10 rounded-2xl object-contain bg-white shadow-sm dark:bg-slate-900"
          />
          <div>
            <p className="text-sm font-semibold text-slate-950 dark:text-white">Big Cities</p>
            <p className="text-xs text-slate-500">Information</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {siteConfig.navItems.map((item) => (
            <NavLink key={item.href} to={item.href} className={({ isActive }) => `text-sm font-medium transition hover:text-slate-950 dark:hover:text-white ${isActive ? 'text-cyan-800 dark:text-cyan-300' : 'text-slate-600 dark:text-slate-300'}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={handleSearch} className="hidden flex-1 basis-[280px] items-center gap-3 lg:flex">
          <div className="relative flex min-w-[220px] flex-1 items-center">
            <label className="flex w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
              <Search className="h-4 w-4 shrink-0 text-slate-500" />
              <Input
                name="query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => query.trim().length >= 1 && setOpen(true)}
                onBlur={() => window.setTimeout(() => setOpen(false), 120)}
                aria-label="Search countries"
                placeholder="Search Countries Here..."
                className="h-8 min-w-0 flex-1 border-0 bg-transparent px-0 py-0 shadow-none"
              />
              {isLoading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-500" /> : null}
            </label>
            {open && (query.trim().length >= 1 || error) ? (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900/95">
                {isLoading ? <p className="px-2 py-3 text-sm text-slate-500">Searching…</p> : null}
                {!isLoading && error ? <p className="px-2 py-3 text-sm text-slate-500">{error}</p> : null}
                {!isLoading && !error ? (
                  <div className="space-y-3">
                    {results.length ? (
                      <div>
                        <p className="px-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Countries</p>
                        <div className="mt-2 space-y-1">
                          {results.map((country) => (
                            <button key={country.code} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => handleSelect(`/country/${country.code}`)} className="flex w-full items-center justify-between rounded-2xl px-2 py-2 text-left text-sm transition hover:bg-slate-100 dark:hover:bg-slate-800">
                              <span className="flex-1">
                                <span className="block font-medium text-slate-900 dark:text-white">{country.name}</span>
                                <span className="block text-xs text-slate-500">{country.continent ?? 'Country'} · {country.code}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="px-2 py-3 text-sm text-slate-500">No countries found</p>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          <button type="button" className="rounded-full border border-slate-200 p-2 text-slate-600 dark:border-slate-700 dark:text-slate-300" aria-label="Language switch">
            <Globe2 className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => navigate('/notifications')} className="rounded-full border border-slate-200 p-2 text-slate-600 dark:border-slate-700 dark:text-slate-300" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-200 p-2 text-slate-600 dark:border-slate-700 dark:text-slate-300"
            aria-label="Toggle theme"
            onClick={() => setMode(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </form>

        <div className="ml-auto flex items-center gap-2">
          {!isAuthenticated ? (
            <>
              <Button type="button" onClick={() => navigate('/login')} variant="outline" size="sm" className="hidden sm:inline-flex">
                Sign in
              </Button>
              <Button type="button" onClick={() => navigate('/register')} size="sm" className="hidden sm:inline-flex">
                Join now
              </Button>
            </>
          ) : (
            <Button type="button" onClick={signOut} variant="ghost" size="sm" className="hidden sm:inline-flex">
              Sign out
            </Button>
          )}
          <button
            className="rounded-full border border-slate-200 p-2 lg:hidden"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            type="button"
            onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>
      {mobileMenuOpen ? (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="relative z-20 border-t border-slate-200/70 bg-white px-4 py-3 shadow-lg dark:border-slate-800 dark:bg-slate-950 lg:hidden sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {siteConfig.navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `rounded-xl px-3 py-3 text-sm font-medium transition hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-slate-900 dark:hover:text-white ${isActive ? 'bg-cyan-50 text-cyan-900 dark:bg-cyan-950/50 dark:text-cyan-200' : 'text-slate-700 dark:text-slate-200'}`}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
