import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

interface StatCardProps {
  label: string;
  value: string;
  icon?: ReactNode;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        {icon ? <div className="text-cyan-600">{icon}</div> : null}
      </div>
      <p className="text-2xl font-semibold text-slate-950 dark:text-white">{value}</p>
    </Card>
  );
}
