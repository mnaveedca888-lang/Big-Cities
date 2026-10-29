import type { QueryClient } from '@tanstack/react-query';

const PUBLIC_DATA_STALE_TIME = 5 * 60_000;

export async function prefetchCountryPage(queryClient: QueryClient, code: string) {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) return;
  try {
    const [catalog, events] = await Promise.all([
      import('@/services/catalog'),
      import('@/services/events'),
    ]);
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['country', normalizedCode],
        queryFn: () => catalog.getCountry(normalizedCode),
        staleTime: PUBLIC_DATA_STALE_TIME,
      }),
      queryClient.prefetchQuery({
        queryKey: ['country-cities', normalizedCode],
        queryFn: () => catalog.getCountryCities(normalizedCode),
        staleTime: PUBLIC_DATA_STALE_TIME,
      }),
      queryClient.prefetchQuery({
        queryKey: ['country-events', normalizedCode],
        queryFn: () => events.getEvents({ country: normalizedCode, perPage: 100 }),
        staleTime: PUBLIC_DATA_STALE_TIME,
      }),
    ]);
  } catch (error) {
    console.error('Unable to prefetch country page data', error);
  }
}

export async function prefetchCityPage(queryClient: QueryClient, slug: string) {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) return;
  try {
    const [catalog, events] = await Promise.all([
      import('@/services/catalog'),
      import('@/services/events'),
    ]);
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['city', normalizedSlug],
        queryFn: () => catalog.getCity(normalizedSlug),
        staleTime: PUBLIC_DATA_STALE_TIME,
      }),
      queryClient.prefetchQuery({
        queryKey: ['events', normalizedSlug],
        queryFn: () => events.getEvents({ city: normalizedSlug }),
        staleTime: PUBLIC_DATA_STALE_TIME,
      }),
    ]);
  } catch (error) {
    console.error('Unable to prefetch city page data', error);
  }
}

export async function prefetchEventPage(queryClient: QueryClient, slug: string) {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) return;
  try {
    const { getEvent } = await import('@/services/events');
    await queryClient.prefetchQuery({
      queryKey: ['event', normalizedSlug],
      queryFn: () => getEvent(normalizedSlug),
      staleTime: PUBLIC_DATA_STALE_TIME,
    });
  } catch (error) {
    console.error('Unable to prefetch event page data', error);
  }
}
