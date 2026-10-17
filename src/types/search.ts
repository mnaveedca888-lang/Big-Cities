import type { EventItem } from './index';

export interface SearchParams {
  query: string;
  page?: number;
  pageSize?: number;
  category?: string;
  country?: string;
  city?: string;
}

export interface SearchResult {
  query: string;
  events: EventItem[];
  countries: Array<{ code: string; name: string }>;
  cities: Array<{ slug: string; name: string; countryCode?: string | null }>;
  categories: Array<{ id: string; name: string; slug: string }>;
  hasMore: {
    events: boolean;
    countries: boolean;
    cities: boolean;
    categories: boolean;
  };
}

export interface SearchResponse {
  success: boolean;
  data: SearchResult;
}
