import { apiClient } from '@/api/client';
import type { ApiResponse } from '@/types/api';
import type { CategoryItem, CityItem, ContinentItem, CountryItem } from '@/types';

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

export async function getCountryDirectory(params?: { q?: string; continent?: string; page?: number; perPage?: number; includeEventCounts?: boolean }) {
  const response = await apiClient.get<ApiResponse<CatalogListResponse<Pick<CountryItem, 'code' | 'name' | 'continent' | 'events'>>>>('/countries/directory', { params });
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

export async function updateCountryWithImages(
  code: string,
  payload: { name: string; continentId?: string | null; profile: Record<string, unknown>; heroImage?: File | null; flagImage?: File | null },
) {
  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('continentId', payload.continentId ?? '');
  formData.append('profile', JSON.stringify(payload.profile));
  if (payload.heroImage) formData.append('heroImage', payload.heroImage);
  if (payload.flagImage) formData.append('flagImage', payload.flagImage);
  const response = await apiClient.post<ApiResponse<CountryItem>>(`/countries/${code}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

export async function createCountry(payload: { code: string; name: string; continentId?: string | null; profile?: Record<string, unknown> | null }) {
  const response = await apiClient.post<ApiResponse<CountryItem>>('/countries', payload);
  return response.data.data;
}

export async function deleteCountry(code: string) {
  await apiClient.delete(`/countries/${code}`);
}

export async function getCountryCities(code: string) {
  const response = await apiClient.get<ApiResponse<CityItem[]>>(`/countries/${code}/cities`);
  return response.data.data;
}

export async function getCountryCityDirectory(code: string, params?: { q?: string; page?: number; perPage?: number; sort?: string }) {
  const response = await apiClient.get<ApiResponse<CatalogListResponse<Pick<CityItem, 'slug' | 'name' | 'countryCode'>>>>(
    `/countries/${code}/cities/directory`,
    { params },
  );
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

export async function createCity(countryCode: string, payload: { slug: string; name: string; countryCode?: string; profile?: Record<string, unknown> | null }) {
  const response = await apiClient.post<ApiResponse<CityItem>>(`/countries/${countryCode}/cities`, payload);
  return response.data.data;
}

export async function deleteCity(slug: string) {
  await apiClient.delete(`/cities/${slug}`);
}

export async function getCities() {
  const response = await apiClient.get<ApiResponse<CityItem[]>>('/cities');
  return response.data.data;
}

export async function getCityDirectory(params: {
  q?: string;
  page?: number;
  perPage?: number;
  aliasSlugs?: string[];
  excludeSlugs?: string[];
}) {
  const { aliasSlugs, excludeSlugs, ...queryParams } = params;
  const response = await apiClient.get<ApiResponse<CatalogListResponse<Pick<CityItem, 'slug' | 'name'>>>>('/cities/directory', {
    params: {
      ...queryParams,
      ...(aliasSlugs?.length ? { aliasSlugs: aliasSlugs.join(',') } : {}),
      ...(excludeSlugs?.length ? { excludeSlugs: excludeSlugs.join(',') } : {}),
    },
  });
  return response.data.data;
}

export async function getVerifiedCityCount() {
  const response = await apiClient.get<ApiResponse<number>>('/cities/count');
  return response.data.data;
}
