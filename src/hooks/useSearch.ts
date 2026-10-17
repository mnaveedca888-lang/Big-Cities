import { useMemo, useState } from 'react';
import type { EventItem } from '@/types';

export function useSearch(events: EventItem[]) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return events;
    return events.filter((event) => [event.title, event.description, event.category, event.city, event.country].some((value) => value.toLowerCase().includes(normalized)));
  }, [events, query]);

  return { query, setQuery, results };
}
