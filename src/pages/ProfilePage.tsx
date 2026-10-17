import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function ProfilePage() {
  const { user } = useAuth();
  const displayName = user?.name || 'Event manager';
  const displayEmail = user?.email || 'member@globalai.local';
  const [name, setName] = useState(displayName);
  const [email, setEmail] = useState(displayEmail);
  const [company, setCompany] = useState('Big Cities Event Monitor');
  const [timezone, setTimezone] = useState('Asia/Karachi');
  const [saved, setSaved] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <>
      <Helmet>
        <title>Profile | Big Cities Event Monitor</title>
        <meta name="description" content="Manage your professional profile and preferences." />
      </Helmet>
      <div className="space-y-6">
        <div className="rounded-4xl border border-slate-200 bg-white/80 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Profile</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">Manage how your workspace profile appears across saved events, alerts, and admin activity.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Card className="space-y-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan-100 text-2xl font-semibold text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">{displayName}</h2>
              <p className="text-sm text-slate-500">{displayEmail}</p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Role: <span className="font-semibold capitalize text-slate-950 dark:text-white">{user?.role || 'member'}</span>
            </div>
          </Card>
          <Card>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="profile-name">
                Full name
                <Input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} aria-label="Full name" />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="profile-email">
                Email
                <Input id="profile-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} aria-label="Email" />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="profile-company">
                Company
                <Input id="profile-company" value={company} onChange={(event) => setCompany(event.target.value)} aria-label="Company" />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="profile-timezone">
                Timezone
                <Input id="profile-timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} aria-label="Timezone" />
              </label>
              <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                <Button type="submit">{saved ? 'Saved' : 'Update profile'}</Button>
                <p className="text-sm text-slate-500">Changes are prepared for future backend sync.</p>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
