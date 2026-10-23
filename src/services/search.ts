import { apiClient } from '@/api/client';
import type { ApiResponse } from '@/types/api';
import type { SearchParams, SearchResult } from '@/types/search';

export async function searchEvents(params: SearchParams, signal?: AbortSignal) {
  const { query, ...rest } = params;
  const response = await apiClient.get<ApiResponse<SearchResult>>('/search', {
    params: {
      q: query,
      ...rest,
    },
    signal,
  });
  return response.data.data;
}

export async function globalSearch(query: string, signal?: AbortSignal) {
  if (!query.trim() || query.trim().length < 2) {
    return {
      query: query.trim(),
      events: [],
      countries: [],
      cities: [],
      categories: [],
      hasMore: {
        events: false,
        countries: false,
        cities: false,
        categories: false,
      },
    } satisfies SearchResult;
  }

  const response = await apiClient.get<ApiResponse<SearchResult>>('/search', { params: { q: query.trim() }, signal });
  return response.data.data;
}
