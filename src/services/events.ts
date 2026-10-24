import { apiClient } from '@/api/client';
import type { ApiResponse } from '@/types/api';
import type { EventItem } from '@/types';

interface EventsPayload {
  items: EventItem[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface EventsPage {
  items: EventItem[];
  pagination: EventsPayload['pagination'];
}

export interface EventsQueryParams {
  city?: string;
  country?: string;
  continent?: string;
  exactCity?: boolean;
  q?: string;
  category?: string;
  featured?: boolean;
  verificationStatus?: string;
  perPage?: number;
  page?: number;
  dailyOnly?: boolean;
}

export function normalizeEventsPayload(payload: ApiResponse<EventsPayload> | ApiResponse<EventItem[]> | EventsPayload | EventItem[] | undefined | null) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if ('items' in payload && payload.items) return payload.items;
  if ('data' in payload && payload.data) {
    const data = payload.data as unknown;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && 'items' in data) {
      return (data as EventsPayload).items ?? [];
    }
  }
  return [];
}

export async function getFeaturedEvents() {
  const response = await apiClient.get<ApiResponse<EventsPayload>>('/events/featured');
  return normalizeEventsPayload(response.data);
}

export async function getEvents(params?: EventsQueryParams) {
  const response = await apiClient.get<ApiResponse<EventsPayload>>('/events', {
    params: params && Object.keys(params).length ? params : undefined,
  });
  return normalizeEventsPayload(response.data);
}

export async function getEventsPage(params: EventsQueryParams): Promise<EventsPage> {
  const response = await apiClient.get<ApiResponse<EventsPayload>>('/events', { params });
  return {
    items: normalizeEventsPayload(response.data),
    pagination: response.data.data.pagination,
  };
}

export async function updateEvent(slug: string, payload: Partial<{
  title: string;
  description: string | null;
  countryCode: string | null;
  citySlug: string | null;
  startAt: string;
  endAt: string;
  tags: string[];
  image: string | null;
  featured: boolean;
  trending: boolean;
  enabled: boolean;
  categoryId: string | null;
}>) {
  const response = await apiClient.patch<ApiResponse<EventItem>>(`/events/${slug}`, payload);
  return response.data.data;
}

export async function getEvent(slug: string) {
  const response = await apiClient.get<ApiResponse<EventItem>>(`/events/${slug}`);
  return response.data?.data ?? null;
}
