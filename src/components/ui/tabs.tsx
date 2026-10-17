import { ReactNode, useState } from 'react';
import { cn } from '@/utils/cn';

interface TabsProps {
  tabs: { id: string; label: string }[];
  children: ReactNode[];
}

export function Tabs({ tabs, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? '');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500', activeTab === tab.id ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700')}> 
            {tab.label}
          </button>
        ))}
      </div>
      {children[tabs.findIndex((tab) => tab.id === activeTab)] ?? null}
    </div>
  );
}
