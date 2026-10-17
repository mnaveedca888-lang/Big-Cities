import { apiClient } from '@/api/client';
import type { ApiResponse, CategoryItem, CityItem, ContinentItem, CountryItem } from '@/types';

const HIDDEN_UI_CATEGORY_NAMES = new Set(['Memorial Day', 'Live Performances', 'Historical Commemoration', 'Traditional Festival', 'National Holiday']);

export function isCategoryHiddenByUi(name?: string | null) {
  return typeof name === 'string' && HIDDEN_UI_CATEGORY_NAMES.has(name.trim());
}

export function filterHiddenCategories<T extends { name?: string | null }>(items: T[] | null | undefined) {
  return (items ?? []).filter((item) => !isCategoryHiddenByUi(item.name));
}

export interface CatalogListResponse<T> {
  items: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export async function getCategories(params?: { q?: string; page?: number; perPage?: number; sort?: string }) {
  const response = await apiClient.get<ApiResponse<CatalogListResponse<CategoryItem>>>('/categories', { params });
  const data = response.data.data;
  return {
    ...data,
    items: filterHiddenCategories(data.items),
  };
}

export async function getContinents() {
  const response = await apiClient.get<ApiResponse<ContinentItem[]>>('/continents');
  return response.data.data;
}

export async function getCategory(slug: string) {
  const response = await apiClient.get<ApiResponse<CategoryItem>>(`/categories/${slug}`);
  return response.data.data;
}

export async function createCategory(payload: { name: string; slug: string; description?: string }) {
  const response = await apiClient.post<ApiResponse<CategoryItem>>('/categories', payload);
  return response.data.data;
}

export async function updateCategory(slug: string, payload: { name?: string; slug?: string; description?: string }) {
  const response = await apiClient.patch<ApiResponse<CategoryItem>>(`/categories/${slug}`, payload);
  return response.data.data;
}

export async function deleteCategory(slug: string) {
  await apiClient.delete(`/categories/${slug}`);
}

export async function getCountries(params?: { q?: string; continent?: string; page?: number; perPage?: number; sort?: string }) {
  const response = await apiClient.get<ApiResponse<CatalogListResponse<CountryItem>>>('/countries', { params });
  return response.data.data;
}

export async function getCountry(code: string) {
  const response = await apiClient.get<ApiResponse<CountryItem>>(`/countries/${code}`);
  return response.data.data;
}

export async function updateCountry(code: string, payload: { name?: string; continentId?: string | null; profile?: Record<string, unknown> | null }) {
  const response = await apiClient.patch<ApiResponse<CountryItem>>(`/countries/${code}`, payload);
  return response.data.data;
}

export async function getCountryCities(code: string) {
  const response = await apiClient.get<ApiResponse<CityItem[]>>(`/countries/${code}/cities`);
  return response.data.data;
}

export async function getCity(slug: string) {
  const response = await apiClient.get<ApiResponse<CityItem>>(`/cities/${slug}`);
  return response.data.data;
}

export async function updateCity(slug: string, payload: { name?: string; countryCode?: string; profile?: Record<string, unknown> | null }) {
  const response = await apiClient.patch<ApiResponse<CityItem>>(`/cities/${slug}`, payload);
  return response.data.data;
}

export async function getCities() {
  const response = await apiClient.get<ApiResponse<CityItem[]>>('/cities');
  return response.data.data;
}
