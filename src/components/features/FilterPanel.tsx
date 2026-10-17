import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { FilterState } from '@/types/api';

interface FilterPanelProps {
  filters: FilterState;
  onChange: (updates: Partial<FilterState>) => void;
}

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Advanced filters</h3>
      <Input placeholder="Search" value={filters.search} onChange={(event) => onChange({ search: event.target.value })} />
      <Input placeholder="Category" value={filters.category} onChange={(event) => onChange({ category: event.target.value })} />
      <Input placeholder="Country" value={filters.country} onChange={(event) => onChange({ country: event.target.value })} />
      <Input placeholder="City" value={filters.city} onChange={(event) => onChange({ city: event.target.value })} />
      <Button variant="outline" className="w-full">Apply filters</Button>
    </Card>
  );
}
