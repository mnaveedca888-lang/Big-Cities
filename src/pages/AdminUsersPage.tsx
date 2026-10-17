import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';

const users = [
  { name: 'Alicia Chen', role: 'Admin', status: 'Active' },
  { name: 'Marcus Lee', role: 'Editor', status: 'Pending' },
  { name: 'Leah Gomez', role: 'Viewer', status: 'Active' },
];

export default function AdminUsersPage() {
  return (
    <>
      <Helmet>
        <title>Admin Users | Big Cities Event Monitor</title>
      </Helmet>
      <div className="space-y-6">
        <Card>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Users</h1>
          <div className="mt-4 space-y-3">
            {users.map((user) => (
              <div key={user.name} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <div>
                  <p className="font-semibold text-slate-950 dark:text-white">{user.name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{user.role}</p>
                </div>
                <span className="text-sm text-slate-500">{user.status}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

