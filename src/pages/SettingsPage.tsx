import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsPage() {
  const { compactMode, reduceMotion, setCompactMode, setReduceMotion } = useSettings();
  const { mode, setMode } = useTheme();

  return (
    <>
      <Helmet>
        <title>Settings | Big Cities Event Monitor</title>
        <meta name="description" content="Adjust your preferences and workspace settings." />
      </Helmet>
      <div className="space-y-6">
        <div className="rounded-4xl border border-slate-200 bg-white/80 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Settings</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">Tune the dashboard experience, motion, and theme preferences for your workspace.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Appearance</h2>
              <p className="mt-1 text-sm text-slate-500">Choose the visual mode used across the app.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['light', 'dark', 'system'] as const).map((themeMode) => (
                <Button key={themeMode} type="button" variant={mode === themeMode ? 'default' : 'outline'} onClick={() => setMode(themeMode)}>
                  {themeMode[0].toUpperCase() + themeMode.slice(1)}
                </Button>
              ))}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
              Current theme preference: <span className="font-semibold capitalize text-slate-950 dark:text-white">{mode}</span>
            </div>
          </Card>
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Workspace preferences</h2>
            <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800" htmlFor="compact-mode">
              <span>
                <span className="block text-sm font-medium text-slate-950 dark:text-white">Compact mode</span>
                <span className="block text-sm text-slate-500">Use denser cards and tables for monitoring-heavy workflows.</span>
              </span>
              <input id="compact-mode" type="checkbox" checked={compactMode} onChange={(event) => setCompactMode(event.target.checked)} className="h-5 w-5 accent-cyan-600" />
            </label>
            <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800" htmlFor="reduce-motion">
              <span>
                <span className="block text-sm font-medium text-slate-950 dark:text-white">Reduce motion</span>
                <span className="block text-sm text-slate-500">Limit animated transitions where possible.</span>
              </span>
              <input id="reduce-motion" type="checkbox" checked={reduceMotion} onChange={(event) => setReduceMotion(event.target.checked)} className="h-5 w-5 accent-cyan-600" />
            </label>
          </Card>
        </div>
      </div>
    </>
  );
}

