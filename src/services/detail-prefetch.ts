import type { QueryClient } from '@tanstack/react-query';
import type { CityItem } from '@/types';
import { getCity, getCountry } from '@/services/catalog';
import { getEvent } from '@/services/events';

export function prefetchCityDetail(queryClient: QueryClient, slug: string) {
  if (!slug) return;
  return queryClient.prefetchQuery({
    queryKey: ['city', slug],
    queryFn: () => getCity(slug),
  });
}

export function prefetchCountryDetail(queryClient: QueryClient, code: string) {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) return;
  return queryClient.prefetchQuery({
    queryKey: ['country', normalizedCode],
    queryFn: () => getCountry(normalizedCode),
  });
}

export function prefetchEventDetail(queryClient: QueryClient, slug: string) {
  if (!slug) return;
  return queryClient.prefetchQuery({
    queryKey: ['event', slug],
    queryFn: () => getEvent(slug),
  });
}

export function primeCityDetail(queryClient: QueryClient, city: CityItem) {
  if (!city.slug || queryClient.getQueryData(['city', city.slug])) return;
  queryClient.setQueryData(['city', city.slug], city);
}
