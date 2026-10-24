import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { DataState } from '@/components/ui/data-state';
import { SEO } from '@/components/seo/SEO';
import { apiClient } from '@/api/client';
import { normalizeImageUrl } from '@/utils/imageValidation';
import { apiBaseUrl } from '@/config/runtime';
import {
  createCity,
  createCountry,
  deleteCity,
  deleteCountry,
  getCategories,
  getCity,
  getContinents,
  getCountry,
  getCountries,
  getCountryCityDirectory,
  updateCountry,
  updateCity,
} from '@/services/catalog';
import { createEvent, deleteEvent, getEvent, getEventsPage, updateEvent } from '@/services/events';
import { getDashboardOverview } from '@/services/dashboard';
import type { CategoryItem, CountryItem, CityItem, ContinentItem, EventItem } from '@/types';
import { isApiError } from '@/types/errors';
import { formatAreaValue, parseAreaInput } from '@/utils/format';

type CountryFormState = {
  name: string;
  code: string;
  continentId: string;
  heroImageUrl: string;
  flagImageUrl: string;
};

type CityFormState = {
  slug: string;
  name: string;
  countryCode: string;
  heroImageUrl: string;
};

type EventFormState = {
  title: string;
  description: string;
  categoryId: string;
  countryCode: string;
  citySlug: string;
  startAt: string;
  endAt: string;
  tags: string;
  image: string;
  venue: string;
  organizer: string;
  province: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: string;
  primarySourceUrl: string;
  primarySourceName: string;
  primarySourceType: string;
  discoverySourceUrl: string;
  discoverySourceName: string;
  dateOnly: boolean;
  enabled: boolean;
  featured: boolean;
  trending: boolean;
};

type ProfileValue = string | number | boolean | null | undefined | Record<string, unknown> | Array<string | number | boolean | Record<string, unknown> | null | undefined>;

function formatLabel(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function emptyEventForm(countryCode = ''): EventFormState {
  return {
    title: '', description: '', categoryId: '', countryCode, citySlug: '',
    startAt: '', endAt: '', tags: '', image: '', venue: '', organizer: '',
    province: '', sourceName: '', sourceUrl: '', sourceType: '',
    primarySourceUrl: '', primarySourceName: '', primarySourceType: '',
    discoverySourceUrl: '', discoverySourceName: '', dateOnly: false,
    enabled: true, featured: false, trending: false,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (isApiError(error) || error instanceof Error) return error.message;
  return fallback;
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function cloneValue(value: unknown): unknown {
  if (typeof value === 'undefined') return undefined;
  if (Array.isArray(value)) return value.map((item) => cloneValue(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, cloneValue(item)]));
  }
  return value;
}

function readCountryForm(country: CountryItem | null, continents: Array<{ id: string; name: string }> = []): CountryFormState {
  const profile = country?.profile && typeof country.profile === 'object' ? (country.profile as Record<string, unknown>) : {};
  return {
    name: country?.name ?? '',
    code: country?.code ?? '',
    continentId: continents.find((continent) => continent.name === country?.continent)?.id ?? '',
    heroImageUrl: typeof profile.heroImageUrl === 'string' ? profile.heroImageUrl : country?.image ?? '',
    flagImageUrl: typeof profile.flagImageUrl === 'string' ? profile.flagImageUrl : country?.flagImage ?? '',
  };
}

function readCityForm(city: CityItem | null, fallbackCountryCode: string): CityFormState {
  const profile = city?.profile && typeof city.profile === 'object' ? (city.profile as Record<string, unknown>) : {};
  return {
    slug: city?.slug ?? '',
    name: city?.name ?? '',
    countryCode: city?.countryCode ?? fallbackCountryCode,
    heroImageUrl: typeof profile.heroImageUrl === 'string' ? profile.heroImageUrl : city?.image ?? '',
  };
}

function readEventForm(event: EventItem | null): EventFormState {
  const tags = event?.tags;
  return {
    title: event?.title ?? '',
    description: event?.description ?? '',
    categoryId: event?.categoryId ?? '',
    countryCode: event?.countryCode ?? '',
    citySlug: event?.citySlug ?? '',
    startAt: toDateTimeLocal(event?.startAt),
    endAt: toDateTimeLocal(event?.endAt),
    tags: Array.isArray(tags) ? tags.join(', ') : typeof tags === 'string' ? tags : '',
    image: event?.image ?? '',
    venue: event?.venue ?? '',
    organizer: event?.organizer ?? '',
    province: event?.province ?? '',
    sourceName: event?.sourceName ?? '',
    sourceUrl: event?.sourceUrl ?? '',
    sourceType: event?.sourceType ?? '',
    primarySourceUrl: event?.primarySourceUrl ?? '',
    primarySourceName: event?.primarySourceName ?? '',
    primarySourceType: event?.primarySourceType ?? '',
    discoverySourceUrl: event?.discoverySourceUrl ?? '',
    discoverySourceName: event?.discoverySourceName ?? '',
    dateOnly: event?.dateOnly ?? false,
    enabled: event?.enabled ?? true,
    featured: Boolean(event?.featured),
    trending: Boolean(event?.trending),
  };
}

function getFieldType(key: string, value: unknown): 'text' | 'number' | 'date' | 'url' | 'textarea' | 'boolean' | 'array' | 'object' {
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (/url|image|photo|thumbnail|logo|icon/i.test(key)) return 'url';
    if (/date|year|founded|born|since|until|published|updated|start|end/i.test(key) && /^\d{4}-\d{2}-\d{2}$/.test(normalized)) return 'date';
    if (normalized.length > 180 || /overview|description|about|geography|economy|government|culture|history|summary|notes|sources/i.test(key)) return 'textarea';
    return 'text';
  }
  if (value && typeof value === 'object') return 'object';
  return 'text';
}

function getNextObjectState(current: Record<string, unknown>, key: string, nextValue: unknown): Record<string, unknown> {
  return {
    ...current,
    [key]: nextValue,
  };
}

function DynamicProfileEditor({ value, onChange }: { value: Record<string, unknown>; onChange: (nextValue: Record<string, unknown>) => void }) {
  const entries = Object.entries(value ?? {});

  const updateEntry = (key: string, nextValue: unknown) => {
    onChange(getNextObjectState(value, key, nextValue));
  };

  const updateArrayItem = (key: string, index: number, itemValue: string) => {
    const currentArray = Array.isArray(value[key]) ? [...value[key] as Array<unknown>] : [];
    currentArray[index] = itemValue;
    updateEntry(key, currentArray);
  };

  const removeArrayItem = (key: string, index: number) => {
    const currentArray = Array.isArray(value[key]) ? [...value[key] as Array<unknown>] : [];
    currentArray.splice(index, 1);
    updateEntry(key, currentArray);
  };

  const addArrayItem = (key: string) => {
    const currentArray = Array.isArray(value[key]) ? [...value[key] as Array<unknown>] : [];
    updateEntry(key, [...currentArray, '']);
  };

  return (
    <div className="space-y-4">
      {entries.map(([key, itemValue]) => {
        const fieldType = getFieldType(key, itemValue);

        if (key.toLowerCase() === 'area' && (typeof itemValue === 'string' || typeof itemValue === 'number' || itemValue == null)) {
          return (
            <label key={key} className="block space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <span>{formatLabel(key)}</span>
              <input
                type="text"
                value={itemValue == null || itemValue === '' ? '' : formatAreaValue(itemValue)}
                onChange={(event) => updateEntry(key, parseAreaInput(event.target.value, itemValue))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
          );
        }

        if (fieldType === 'object' && itemValue && typeof itemValue === 'object' && !Array.isArray(itemValue)) {
          return (
            <div key={key} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{formatLabel(key)}</div>
              <DynamicProfileEditor
                value={itemValue as Record<string, unknown>}
                onChange={(nextObject) => updateEntry(key, nextObject)}
              />
            </div>
          );
        }

        if (fieldType === 'array') {
          const arrayValue = Array.isArray(itemValue) ? itemValue : [];
          return (
            <div key={key} className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{formatLabel(key)}</div>
              <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                {arrayValue.length === 0 ? (
                  <div className="text-sm text-slate-500">No entries yet.</div>
                ) : (
                  arrayValue.map((arrayItem, arrayIndex) => (
                    <div key={`${key}-${arrayIndex}`} className="flex gap-2">
                      <input
                        value={String(arrayItem ?? '')}
                        onChange={(event) => updateArrayItem(key, arrayIndex, event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                      />
                      <button type="button" onClick={() => removeArrayItem(key, arrayIndex)} className="rounded-xl border border-slate-200 px-2 py-2 text-xs dark:border-slate-700">Remove</button>
                    </div>
                  ))
                )}
                <button type="button" onClick={() => addArrayItem(key)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:border-cyan-500 dark:border-slate-700 dark:text-slate-300">Add item</button>
              </div>
            </div>
          );
        }

        if (fieldType === 'boolean') {
          return (
            <label key={key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
              <span className="text-sm text-slate-700 dark:text-slate-300">{formatLabel(key)}</span>
              <input
                type="checkbox"
                checked={Boolean(itemValue)}
                onChange={(event) => updateEntry(key, event.target.checked)}
              />
            </label>
          );
        }

        if (fieldType === 'number') {
          return (
            <label key={key} className="block space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <span>{formatLabel(key)}</span>
              <input
                type="number"
                value={typeof itemValue === 'number' ? itemValue : 0}
                onChange={(event) => updateEntry(key, Number(event.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
          );
        }

        if (fieldType === 'date') {
          return (
            <label key={key} className="block space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <span>{formatLabel(key)}</span>
              <input
                type="date"
                value={typeof itemValue === 'string' ? itemValue.slice(0, 10) : ''}
                onChange={(event) => updateEntry(key, event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
          );
        }

        if (fieldType === 'url') {
          return (
            <label key={key} className="block space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <span>{formatLabel(key)}</span>
              <input
                type="url"
                value={typeof itemValue === 'string' ? itemValue : ''}
                onChange={(event) => updateEntry(key, event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
          );
        }

        if (fieldType === 'textarea') {
          return (
            <label key={key} className="block space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <span>{formatLabel(key)}</span>
              <textarea
                value={typeof itemValue === 'string' ? itemValue : ''}
                onChange={(event) => updateEntry(key, event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
          );
        }

        return (
          <label key={key} className="block space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <span>{formatLabel(key)}</span>
            <input
              type="text"
              value={typeof itemValue === 'string' || typeof itemValue === 'number' ? String(itemValue) : ''}
              onChange={(event) => updateEntry(key, event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
        );
      })}
    </div>
  );
}

async function uploadImageFile(file: File, onProgress: (progress: number) => void) {
  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
  if (!allowedTypes.has(file.type)) throw new Error('Choose a JPG, PNG, WebP, GIF, or AVIF image.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Image must be 5 MB or smaller.');
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<{ success: boolean; data?: Array<{ url: string }> }>('/uploads/files', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (event) => {
      if (event.total) onProgress(Math.round((event.loaded / event.total) * 100));
    },
  });
  const uploadedUrl = response.data?.data?.[0]?.url;
  if (!uploadedUrl) throw new Error('Upload failed');
  const localImageUrl = normalizeImageUrl(uploadedUrl);
  if (!localImageUrl) throw new Error('Upload returned a non-local image path');
  return localImageUrl;
}

function ImagePreview({ value, label }: { value: string; label: string }) {
  const [failed, setFailed] = useState(false);
  const src = normalizeImageUrl(value);

  useEffect(() => setFailed(false), [src]);

  if (!src) return null;
  if (failed) return <p className="text-xs text-amber-700 dark:text-amber-300">Image preview unavailable.</p>;
  return <img src={src} alt={label} loading="lazy" className="mt-2 h-24 w-full rounded-xl border border-slate-200 object-cover dark:border-slate-700" onError={() => setFailed(true)} />;
}

function PageControls({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="mt-3 flex items-center justify-between gap-2 text-sm" aria-label="Manager pagination">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-50 dark:border-slate-700">Previous</button>
      <span aria-live="polite">Page {page} of {totalPages}</span>
      <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-50 dark:border-slate-700">Next</button>
    </nav>
  );
}

function buildCountryProfileState(country: CountryItem | null): Record<string, unknown> {
  const raw = country?.profile && typeof country.profile === 'object' ? (country.profile as Record<string, unknown>) : {};
  return cloneValue(raw) as Record<string, unknown>;
}

function buildCityProfileState(city: CityItem | null): Record<string, unknown> {
  const raw = city?.profile && typeof city.profile === 'object' ? (city.profile as Record<string, unknown>) : {};
  return cloneValue(raw) as Record<string, unknown>;
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const overview = useQuery({ queryKey: ['dashboard-overview'], queryFn: getDashboardOverview, staleTime: 30_000 });
  const [countrySearch, setCountrySearch] = useState('');
  const [countryQuery, setCountryQuery] = useState('');
  const [countryPage, setCountryPage] = useState(1);
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [isCreatingCountry, setIsCreatingCountry] = useState(false);
  const [isCreatingCity, setIsCreatingCity] = useState(false);
  const [selectedCitySlug, setSelectedCitySlug] = useState('');
  const [cityPage, setCityPage] = useState(1);
  const [citySearch, setCitySearch] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [eventQuery, setEventQuery] = useState('');
  const [eventPage, setEventPage] = useState(1);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [selectedEventSlug, setSelectedEventSlug] = useState('');
  const [countryForm, setCountryForm] = useState<CountryFormState>({ name: '', code: '', continentId: '', heroImageUrl: '', flagImageUrl: '' });
  const [countryProfileData, setCountryProfileData] = useState<Record<string, unknown>>({});
  const [cityForm, setCityForm] = useState<CityFormState>({ slug: '', name: '', countryCode: '', heroImageUrl: '' });
  const [cityProfileData, setCityProfileData] = useState<Record<string, unknown>>({});
  const [eventForm, setEventForm] = useState<EventFormState>(emptyEventForm());
  const [saveCountryState, setSaveCountryState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveCountryMessage, setSaveCountryMessage] = useState('');
  const [saveCityState, setSaveCityState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveCityMessage, setSaveCityMessage] = useState('');
  const [saveEventState, setSaveEventState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveEventMessage, setSaveEventMessage] = useState('');
  const [countryDeleteMessage, setCountryDeleteMessage] = useState('');
  const [cityDeleteMessage, setCityDeleteMessage] = useState('');
  const [eventDeleteMessage, setEventDeleteMessage] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCountryPage(1);
      setCountryQuery(countrySearch.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [countrySearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setEventPage(1);
      setEventQuery(eventSearch.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [eventSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCityPage(1);
      setCityQuery(citySearch.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [citySearch]);

  const countriesQuery = useQuery({
    queryKey: ['dashboard-countries', countryQuery, countryPage],
    queryFn: () => getCountries({ q: countryQuery || undefined, page: countryPage, perPage: 12, sort: 'name' }),
    staleTime: 30_000,
  });
  const continentsQuery = useQuery({ queryKey: ['dashboard-continents'], queryFn: getContinents, staleTime: 60_000 });
  const categoriesQuery = useQuery({
    queryKey: ['dashboard-categories'],
    queryFn: () => getCategories({ perPage: 100, sort: 'name' }),
    staleTime: 60_000,
  });

  const countries: CountryItem[] = countriesQuery.data?.items ?? [];
  const filteredCountries = countries;
  const countryPagination = countriesQuery.data?.pagination;
  const continents: ContinentItem[] = continentsQuery.data ?? [];
  const selectedCountryFromList = countries.find((country) => country.code === selectedCountryCode) ?? null;
  const selectedCountryQuery = useQuery({
    queryKey: ['dashboard-country-detail', selectedCountryCode],
    queryFn: () => getCountry(selectedCountryCode),
    enabled: Boolean(selectedCountryCode && !selectedCountryFromList && !isCreatingCountry),
    staleTime: 30_000,
  });

  const selectedCountry = useMemo(
    () => selectedCountryFromList ?? selectedCountryQuery.data ?? null,
    [selectedCountryFromList, selectedCountryQuery.data],
  );

  const countryCitiesQuery = useQuery({
    queryKey: ['dashboard-country-cities', selectedCountryCode, cityQuery, cityPage],
    queryFn: () => getCountryCityDirectory(selectedCountryCode, { q: cityQuery || undefined, page: cityPage, perPage: 12 }),
    enabled: Boolean(selectedCountryCode),
    staleTime: 30_000,
  });
  const cityList: Array<Pick<CityItem, 'slug' | 'name' | 'countryCode'>> = countryCitiesQuery.data?.items ?? [];
  const cityPagination = countryCitiesQuery.data?.pagination;
  const filteredCities = cityList;
  const selectedCityQuery = useQuery({
    queryKey: ['dashboard-city-detail', selectedCitySlug],
    queryFn: () => getCity(selectedCitySlug),
    enabled: Boolean(selectedCitySlug && !isCreatingCity),
    staleTime: 30_000,
  });
  const selectedCity = selectedCityQuery.data ?? null;

  const countryEventsQuery = useQuery({
    queryKey: ['dashboard-country-events', selectedCountryCode, eventQuery, eventPage],
    queryFn: () => getEventsPage({
      country: selectedCountryCode,
      q: eventQuery || undefined,
      includeDisabled: true,
      perPage: 12,
      page: eventPage,
    }),
    enabled: Boolean(selectedCountryCode),
    staleTime: 30_000,
  });

  const eventList: EventItem[] = countryEventsQuery.data?.items ?? [];
  const categories: CategoryItem[] = categoriesQuery.data?.items ?? [];
  const filteredEvents = eventList;
  const eventPagination = countryEventsQuery.data?.pagination;
  const selectedEventFromList = eventList.find((event) => event.slug === selectedEventSlug) ?? null;
  const selectedEventQuery = useQuery({
    queryKey: ['dashboard-event-detail', selectedEventSlug],
    queryFn: () => getEvent(selectedEventSlug),
    enabled: Boolean(selectedEventSlug && !selectedEventFromList && !isCreatingEvent),
    staleTime: 30_000,
  });
  const selectedEvent = selectedEventFromList ?? selectedEventQuery.data ?? null;
  const [imageUploadState, setImageUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [imageUploadMessage, setImageUploadMessage] = useState('');
  const [imageUploadProgress, setImageUploadProgress] = useState(0);

  useEffect(() => {
    if (!isCreatingCountry && countries.length > 0 && !countries.some((country) => country.code === selectedCountryCode)) {
      setSelectedCountryCode(countries[0].code);
    }
  }, [countries, selectedCountryCode, isCreatingCountry]);

  useEffect(() => {
    if (selectedCountry && !isCreatingCountry) {
      const nextCountryForm = readCountryForm(selectedCountry, continents);
      setCountryForm(nextCountryForm);
      setCountryProfileData(buildCountryProfileState(selectedCountry));
      if (!cityList.some((city) => city.slug === selectedCitySlug) && cityList[0]) {
        setSelectedCitySlug(cityList[0].slug);
      }
    }
  }, [selectedCountry, continents, cityList, selectedCitySlug, isCreatingCountry]);

  useEffect(() => {
    if (selectedCityQuery.data && !isCreatingCity) {
      const nextCityForm = readCityForm(selectedCityQuery.data, selectedCountry?.code ?? '');
      setCityForm(nextCityForm);
      setCityProfileData(buildCityProfileState(selectedCityQuery.data));
    }
  }, [selectedCityQuery.data, selectedCountry, isCreatingCity]);

  useEffect(() => {
    if (selectedEvent && !isCreatingEvent) {
      setEventForm(readEventForm(selectedEvent));
    }
  }, [selectedEvent, isCreatingEvent]);

  const saveCountry = async () => {
    const code = countryForm.code.trim().toUpperCase();
    if (!countryForm.name.trim() || !/^[A-Z]{2}$/.test(code)) {
      setSaveCountryState('error');
      setSaveCountryMessage('Enter a country name and a valid two-letter country code.');
      return;
    }
    try {
      setSaveCountryState('saving');
      setSaveCountryMessage('');
      const mergedProfile = { ...countryProfileData } as Record<string, unknown>;
      mergedProfile.heroImageUrl = countryForm.heroImageUrl.trim() || null;
      mergedProfile.flagImageUrl = countryForm.flagImageUrl.trim() || null;
      if (isCreatingCountry) {
        const created = await createCountry({
          code,
          name: countryForm.name.trim(),
          continentId: countryForm.continentId || null,
          profile: mergedProfile,
        });
        setSelectedCountryCode(created.code);
        setCountrySearch(created.name);
        setCountryQuery(created.name);
        setCountryPage(1);
        setIsCreatingCountry(false);
      } else if (selectedCountry) {
        await updateCountry(selectedCountry.code, {
          name: countryForm.name.trim(),
          continentId: countryForm.continentId || null,
          profile: mergedProfile,
        });
      } else {
        return;
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['country'] }),
        queryClient.invalidateQueries({ queryKey: ['countries'] }),
        queryClient.invalidateQueries({ queryKey: ['countries-list'] }),
        queryClient.invalidateQueries({ queryKey: ['header-country-search'] }),
        queryClient.invalidateQueries({ queryKey: ['search'] }),
        queryClient.invalidateQueries({ queryKey: ['home-countries'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-countries'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-country-detail', code] }),
      ]);
      setSaveCountryState('saved');
      setSaveCountryMessage(isCreatingCountry ? 'Country created successfully.' : 'Country updated successfully.');
    } catch (error) {
      setSaveCountryState('error');
      setSaveCountryMessage(error instanceof Error ? error.message : 'Unable to save country. Please try again.');
    }
  };

  const removeCountry = async () => {
    if (!selectedCountry || (selectedCountry.cities ?? 0) > 0 || (selectedCountry.events ?? 0) > 0) return;
    if (!window.confirm(`Delete ${selectedCountry.name}? This cannot be undone.`)) return;
    try {
      setSaveCountryState('saving');
      setCountryDeleteMessage('');
      await deleteCountry(selectedCountry.code);
      setSelectedCountryCode('');
      setIsCreatingCountry(false);
      setCountrySearch('');
      setCountryQuery('');
      setCountryPage(1);
      await queryClient.invalidateQueries({ queryKey: ['dashboard-countries'] });
      setSaveCountryState('saved');
      setCountryDeleteMessage('Country deleted successfully.');
    } catch (error) {
      setSaveCountryState('error');
      setCountryDeleteMessage(getErrorMessage(error, 'Unable to delete country.'));
    }
  };

  const saveCity = async () => {
    const slug = cityForm.slug.trim().toLowerCase();
    const countryCode = cityForm.countryCode.trim().toUpperCase();
    if (!cityForm.name.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !/^[A-Z]{2}$/.test(countryCode) || countryCode !== selectedCountryCode || (!isCreatingCity && selectedCity && countryCode !== selectedCity.countryCode)) {
      setSaveCityState('error');
      setSaveCityMessage('Enter a city name and valid slug; the city must remain associated with the selected country.');
      return;
    }
    try {
      setSaveCityState('saving');
      setSaveCityMessage('');
      const mergedProfile = { ...cityProfileData } as Record<string, unknown>;
      mergedProfile.heroImageUrl = cityForm.heroImageUrl.trim() || null;
      if (isCreatingCity) {
        const created = await createCity(countryCode, {
          slug,
          name: cityForm.name.trim(),
          countryCode,
          profile: mergedProfile,
        });
        setSelectedCitySlug(created.slug);
        setIsCreatingCity(false);
      } else if (selectedCity) {
        await updateCity(selectedCity.slug, {
          name: cityForm.name.trim(),
          countryCode,
          profile: mergedProfile,
        });
      } else {
        return;
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['city'] }),
        queryClient.invalidateQueries({ queryKey: ['cities'] }),
        queryClient.invalidateQueries({ queryKey: ['country-cities'] }),
        queryClient.invalidateQueries({ queryKey: ['home-cities'] }),
        queryClient.invalidateQueries({ queryKey: ['about-cities'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-country-cities'] }),
        ...(selectedCity ? [queryClient.invalidateQueries({ queryKey: ['dashboard-city-detail', selectedCity.slug] })] : []),
        queryClient.invalidateQueries({ queryKey: ['search'] }),
      ]);
      setSaveCityState('saved');
      setSaveCityMessage(isCreatingCity ? 'City created successfully.' : 'City updated successfully.');
    } catch (error) {
      setSaveCityState('error');
      setSaveCityMessage(getErrorMessage(error, 'Unable to save city. Please try again.'));
    }
  };

  const removeCity = async () => {
    if (!selectedCity) return;
    if (!window.confirm(`Delete ${selectedCity.name}? The server will protect cities linked to events.`)) return;
    try {
      setSaveCityState('saving');
      setCityDeleteMessage('');
      await deleteCity(selectedCity.slug);
      setSelectedCitySlug('');
      setIsCreatingCity(false);
      setCityPage(1);
      await queryClient.invalidateQueries({ queryKey: ['dashboard-country-cities', selectedCountryCode] });
      setSaveCityState('saved');
      setCityDeleteMessage('City deleted successfully.');
    } catch (error) {
      setSaveCityState('error');
      setCityDeleteMessage(getErrorMessage(error, 'Unable to delete city.'));
    }
  };

  const saveEvent = async () => {
    const startAt = new Date(eventForm.startAt);
    const endAt = new Date(eventForm.endAt);
    if (!eventForm.title.trim() || !eventForm.startAt || !eventForm.endAt || Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || startAt > endAt) {
      setSaveEventState('error');
      setSaveEventMessage('Enter an event title and valid dates; the end must be after the start.');
      return;
    }
    try {
      const creating = isCreatingEvent;
      setSaveEventState('saving');
      setSaveEventMessage('');
      const tags = eventForm.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
      const payload = {
        title: eventForm.title,
        description: eventForm.description || null,
        categoryId: eventForm.categoryId || null,
        countryCode: eventForm.countryCode || selectedCountry?.code || null,
        citySlug: eventForm.citySlug || null,
        startAt: eventForm.startAt ? new Date(eventForm.startAt).toISOString() : undefined,
        endAt: eventForm.endAt ? new Date(eventForm.endAt).toISOString() : undefined,
        tags: tags.length ? tags : [],
        image: eventForm.image || null,
        dateOnly: eventForm.dateOnly,
        venue: eventForm.venue.trim() || null,
        organizer: eventForm.organizer.trim() || null,
        province: eventForm.province.trim() || null,
        sourceName: eventForm.sourceName.trim() || null,
        sourceUrl: eventForm.sourceUrl.trim() || null,
        sourceType: eventForm.sourceType.trim() || null,
        primarySourceUrl: eventForm.primarySourceUrl.trim() || null,
        primarySourceName: eventForm.primarySourceName.trim() || null,
        primarySourceType: eventForm.primarySourceType.trim() || null,
        discoverySourceUrl: eventForm.discoverySourceUrl.trim() || null,
        discoverySourceName: eventForm.discoverySourceName.trim() || null,
        enabled: eventForm.enabled,
        featured: eventForm.featured,
        trending: eventForm.trending,
      };
      if (creating) {
        const created = await createEvent({
          ...payload,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
        });
        setSelectedEventSlug(created.slug);
        setIsCreatingEvent(false);
      } else if (selectedEvent) {
        await updateEvent(selectedEvent.slug, {
          ...payload,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
        });
      } else {
        return;
      }
      await Promise.all([
        ...(selectedEvent ? [queryClient.invalidateQueries({ queryKey: ['event', selectedEvent.slug] })] : []),
        ...(selectedEvent ? [queryClient.invalidateQueries({ queryKey: ['dashboard-event-detail', selectedEvent.slug] })] : []),
        queryClient.invalidateQueries({ queryKey: ['events'] }),
        queryClient.invalidateQueries({ queryKey: ['events-list'] }),
        queryClient.invalidateQueries({ queryKey: ['country-events'] }),
        queryClient.invalidateQueries({ queryKey: ['country-daily-events'] }),
        queryClient.invalidateQueries({ queryKey: ['search'] }),
        queryClient.invalidateQueries({ queryKey: ['home-featured-events'] }),
        queryClient.invalidateQueries({ queryKey: ['home-location-events'] }),
        queryClient.invalidateQueries({ queryKey: ['gallery-events'] }),
        queryClient.invalidateQueries({ queryKey: ['about-events'] }),
        queryClient.invalidateQueries({ queryKey: ['home-platform-counts'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-country-events'] }),
      ]);
      setSaveEventState('saved');
      setSaveEventMessage(creating ? 'Event created successfully.' : 'Event updated successfully.');
    } catch (error) {
      setSaveEventState('error');
      setSaveEventMessage(getErrorMessage(error, 'Unable to save event. Please try again.'));
    }
  };

  const removeEvent = async () => {
    if (!selectedEvent) return;
    if (!window.confirm(`Delete "${selectedEvent.title}"? The server will prevent deletion if users have saved it.`)) return;
    try {
      setSaveEventState('saving');
      setEventDeleteMessage('');
      await deleteEvent(selectedEvent.slug);
      setSelectedEventSlug('');
      setIsCreatingEvent(false);
      setEventPage(1);
      await queryClient.invalidateQueries({ queryKey: ['dashboard-country-events', selectedCountryCode] });
      setSaveEventState('saved');
      setEventDeleteMessage('Event deleted successfully.');
    } catch (error) {
      setSaveEventState('error');
      setEventDeleteMessage(getErrorMessage(error, 'Unable to delete event.'));
    }
  };
  const resetCountryForm = () => {
    if (isCreatingCountry) {
      setCountryForm({ name: '', code: '', continentId: '', heroImageUrl: '', flagImageUrl: '' });
      setCountryProfileData({});
      setSaveCountryState('idle');
      setSaveCountryMessage('');
    } else if (selectedCountry) {
      const nextCountryForm = readCountryForm(selectedCountry, continents);
      setCountryForm(nextCountryForm);
      setCountryProfileData(buildCountryProfileState(selectedCountry));
      setSaveCountryState('idle');
      setSaveCountryMessage('');
    }
  };

  useEffect(() => {
    if (saveCountryState === 'saved' || saveCountryState === 'error') {
      const timer = window.setTimeout(() => {
        setSaveCountryState('idle');
        setSaveCountryMessage('');
      }, 4000);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [saveCountryState]);

  const resetCityForm = () => {
    if (isCreatingCity) {
      setCityForm({ slug: '', name: '', countryCode: selectedCountryCode, heroImageUrl: '' });
      setCityProfileData({});
      setSaveCityState('idle');
      setSaveCityMessage('');
    } else if (selectedCity) {
      const nextCityForm = readCityForm(selectedCity, selectedCountry?.code ?? '');
      setCityForm(nextCityForm);
      setCityProfileData(buildCityProfileState(selectedCity));
      setSaveCityState('idle');
      setSaveCityMessage('');
    }
  };

  const resetEventForm = () => {
    if (isCreatingEvent) {
      setEventForm(emptyEventForm(selectedCountryCode));
      setSaveEventState('idle');
      setSaveEventMessage('');
    } else if (selectedEvent) {
      setEventForm(readEventForm(selectedEvent));
      setSaveEventState('idle');
      setSaveEventMessage('');
    }
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>, onApply: (nextUrl: string) => void) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setImageUploadState('uploading');
      setImageUploadProgress(0);
      setImageUploadMessage('Uploading image…');
      const url = await uploadImageFile(file, setImageUploadProgress);
      onApply(url);
      setImageUploadState('success');
      setImageUploadMessage('Image uploaded. Save the record to apply it.');
    } catch (error) {
      setImageUploadState('error');
      setImageUploadMessage(getErrorMessage(error, 'Unable to upload image. Please try again.'));
    } finally {
      event.target.value = '';
    }
  };

  return (
    <>
      <SEO title="Dashboard | Big Cities Event Monitor" description="Manage countries, cities, and events from the dashboard." />
      <div className="space-y-8">
        <div className="rounded-4xl border border-slate-200 bg-white/80 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Dashboard management</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">Manage country, city, and event records with validated API-backed forms.</p>
        </div>
        {imageUploadMessage ? (
          <p className={`text-sm ${imageUploadState === 'error' ? 'text-rose-600' : imageUploadState === 'success' ? 'text-emerald-600' : 'text-slate-500'}`} role="status" aria-live="polite">
            {imageUploadState === 'uploading' ? `${imageUploadMessage} ${imageUploadProgress}%` : imageUploadMessage}
          </p>
        ) : null}

        <DataState isLoading={overview.isLoading || countriesQuery.isLoading} error={overview.error || countriesQuery.error ? 'Dashboard data is unavailable.' : undefined} onRetry={() => { void overview.refetch(); void countriesQuery.refetch(); }}>
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <p className="text-sm text-slate-500">Total users</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{overview.data?.totalUsers ?? 0}</p>
            </Card>
            <Card>
              <p className="text-sm text-slate-500">Total events</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{overview.data?.totalEvents ?? 0}</p>
            </Card>
            <Card>
              <p className="text-sm text-slate-500">Upcoming</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{overview.data?.upcomingEvents ?? 0}</p>
            </Card>
            <Card>
              <p className="text-sm text-slate-500">Saved events</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{overview.data?.savedEvents ?? 0}</p>
            </Card>
          </div>
        </DataState>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Country data manager</h2>
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">{countryPagination?.total ?? 0}</span>
              <button type="button" onClick={() => {
                setIsCreatingCountry(true);
                setSelectedCountryCode('');
                setCountryForm({ name: '', code: '', continentId: '', heroImageUrl: '', flagImageUrl: '' });
                setCountryProfileData({});
                setSaveCountryState('idle');
                setSaveCountryMessage('');
              }} className="rounded-xl bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-700">Create country</button>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div>
              <input value={countrySearch} onChange={(event) => setCountrySearch(event.target.value)} placeholder="Search country" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
              <div className="mt-4 space-y-2">
                {filteredCountries.slice(0, 12).map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => {
                      setIsCreatingCountry(false);
                      setSelectedCountryCode(country.code);
                      setSelectedCitySlug('');
                      setSelectedEventSlug('');
                      setCityPage(1);
                      setEventPage(1);
                      setSaveCountryState('idle');
                      setCountryDeleteMessage('');
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${selectedCountryCode === country.code ? 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:border-cyan-500 dark:bg-cyan-500/10 dark:text-cyan-200' : 'border-slate-200 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:text-slate-300'}`}
                  >
                    <span>{country.name}</span>
                    <span className="text-xs uppercase tracking-[0.2em]">{country.code}</span>
                  </button>
                ))}
              </div>
              {countriesQuery.isFetching ? <p className="mt-3 text-xs text-slate-500" role="status">Loading countries…</p> : null}
              {!countriesQuery.isLoading && countriesQuery.isError ? <div className="mt-3 text-sm text-rose-600"><p>Countries could not be loaded.</p><button type="button" onClick={() => void countriesQuery.refetch()} className="mt-1 underline">Retry</button></div> : null}
              {!countriesQuery.isLoading && !countriesQuery.isError && filteredCountries.length === 0 ? <p className="mt-3 text-sm text-slate-500">No countries found.</p> : null}
              <PageControls page={countryPagination?.page ?? countryPage} totalPages={countryPagination?.totalPages ?? 1} onChange={setCountryPage} />
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              {countryDeleteMessage ? <p role="status" aria-live="polite" className={`text-sm ${saveCountryState === 'saved' ? 'text-emerald-600' : 'text-rose-600'}`}>{countryDeleteMessage}</p> : null}
              {selectedCountry || isCreatingCountry ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span>Country name</span>
                      <input value={countryForm.name} onChange={(event) => setCountryForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
                    </label>
                    <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span>Country code</span>
                      <input value={countryForm.code} onChange={(event) => setCountryForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} readOnly={!isCreatingCountry} maxLength={2} autoComplete="off" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
                    </label>
                  </div>

                  <label className="block space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    <span>Continent</span>
                    <select value={countryForm.continentId} onChange={(event) => setCountryForm((current) => ({ ...current, continentId: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                      <option value="">No continent</option>
                      {continents.map((continent) => <option key={continent.id} value={continent.id}>{continent.name}</option>)}
                    </select>
                    {continentsQuery.isError ? <span className="block text-rose-600" role="status">Continent choices failed to load. <button type="button" onClick={() => void continentsQuery.refetch()} className="underline">Retry</button></span> : null}
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span>Hero image</span>
                      <input value={countryForm.heroImageUrl} onChange={(event) => setCountryForm((current) => ({ ...current, heroImageUrl: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
                      <ImagePreview value={countryForm.heroImageUrl} label={`${countryForm.name} country`} />
                    </label>
                    <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className="block">Upload new hero image</span>
                      <label className="inline-flex cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 hover:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900">
                        <span>Choose file</span>
                        <input type="file" accept="image/*" className="sr-only" onChange={(event) => void handleImageUpload(event, (nextUrl) => setCountryForm((current) => ({ ...current, heroImageUrl: nextUrl })))} />
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span>Flag image</span>
                      <input value={countryForm.flagImageUrl} onChange={(event) => setCountryForm((current) => ({ ...current, flagImageUrl: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
                      <ImagePreview value={countryForm.flagImageUrl} label={`${countryForm.name} flag`} />
                    </label>
                    <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className="block">Upload new flag image</span>
                      <label className="inline-flex cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 hover:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900">
                        <span>Choose file</span>
                        <input type="file" accept="image/*" className="sr-only" onChange={(event) => void handleImageUpload(event, (nextUrl) => setCountryForm((current) => ({ ...current, flagImageUrl: nextUrl })))} />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Profile fields</div>
                    <DynamicProfileEditor value={countryProfileData} onChange={setCountryProfileData} />
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={saveCountry} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700" disabled={saveCountryState === 'saving'}>
                      {saveCountryState === 'saving' ? 'Saving...' : isCreatingCountry ? 'Create country' : 'Save country'}
                    </button>
                    <button type="button" onClick={resetCountryForm} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset</button>
                    {selectedCountry && !isCreatingCountry ? <button type="button" onClick={() => void removeCountry()} disabled={saveCountryState === 'saving' || (selectedCountry.cities ?? 0) > 0 || (selectedCountry.events ?? 0) > 0} className="rounded-xl border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300">Delete country</button> : null}
                    {isCreatingCountry ? <button type="button" onClick={() => setIsCreatingCountry(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700">Cancel</button> : null}
                  </div>
                  {saveCountryMessage ? (
                    <p className={`mt-2 text-sm ${saveCountryState === 'saved' ? 'text-emerald-600' : 'text-rose-600'}`} role="status" aria-live="polite">
                      {saveCountryMessage}
                    </p>
                  ) : null}
                </>
              ) : (
                <div className="text-sm text-slate-500">
                  {selectedCountryQuery.isLoading ? 'Loading country details…' : selectedCountryQuery.isError ? <><p>Country details could not be loaded.</p><button type="button" onClick={() => void selectedCountryQuery.refetch()} className="mt-1 underline">Retry</button></> : 'Select a country to edit its data, or create a country.'}
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">City data manager</h2>
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">{cityPagination?.total ?? 0}</span>
              <button type="button" disabled={!selectedCountryCode || isCreatingCountry} onClick={() => {
                setIsCreatingCity(true);
                setSelectedCitySlug('');
                setCityForm({ slug: '', name: '', countryCode: selectedCountryCode, heroImageUrl: '' });
                setCityProfileData({});
                setSaveCityState('idle');
                setSaveCityMessage('');
              }} className="rounded-xl bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50">Create city</button>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div>
              <input value={citySearch} onChange={(event) => setCitySearch(event.target.value)} placeholder="Search city" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
              <div className="mt-4 space-y-2">
                {filteredCities.slice(0, 12).map((city) => (
                  <button
                    key={city.slug}
                    type="button"
                    onClick={() => {
                      setIsCreatingCity(false);
                      setSelectedCitySlug(city.slug);
                      setSaveCityState('idle');
                      setSaveCityMessage('');
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${selectedCitySlug === city.slug ? 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:border-cyan-500 dark:bg-cyan-500/10 dark:text-cyan-200' : 'border-slate-200 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:text-slate-300'}`}
                  >
                    <span>{city.name}</span>
                    <span className="text-[10px] uppercase tracking-[0.2em]">{city.countryCode}</span>
                  </button>
                ))}
              </div>
              {countryCitiesQuery.isFetching ? <p className="mt-3 text-xs text-slate-500" role="status">Loading cities…</p> : null}
              {!countryCitiesQuery.isLoading && countryCitiesQuery.isError ? <div className="mt-3 text-sm text-rose-600"><p>Cities could not be loaded.</p><button type="button" onClick={() => void countryCitiesQuery.refetch()} className="mt-1 underline">Retry</button></div> : null}
              {!countryCitiesQuery.isLoading && !countryCitiesQuery.isError && filteredCities.length === 0 ? <p className="mt-3 text-sm text-slate-500">No cities found.</p> : null}
              <PageControls page={cityPagination?.page ?? cityPage} totalPages={cityPagination?.totalPages ?? 1} onChange={setCityPage} />
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              {cityDeleteMessage ? <p role="status" aria-live="polite" className={`text-sm ${saveCityState === 'saved' ? 'text-emerald-600' : 'text-rose-600'}`}>{cityDeleteMessage}</p> : null}
              {selectedCity || isCreatingCity ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span>City name</span>
                      <input value={cityForm.name} onChange={(event) => setCityForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
                    </label>
                    {isCreatingCity ? <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300"><span>City slug</span><input value={cityForm.slug} onChange={(event) => setCityForm((current) => ({ ...current, slug: event.target.value.toLowerCase() }))} placeholder="country-city" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" /></label> : null}
                    <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span>Country code</span>
                      <input value={cityForm.countryCode} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60" />
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm text-slate-700 dark:text-slate-300">
                      <span>Hero image</span>
                      <input value={cityForm.heroImageUrl} onChange={(event) => setCityForm((current) => ({ ...current, heroImageUrl: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
                      <ImagePreview value={cityForm.heroImageUrl} label={`${cityForm.name} city`} />
                    </label>
                    <label className="inline-flex cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900">
                      <span>Upload new image</span>
                      <input type="file" accept="image/*" className="sr-only" onChange={(event) => void handleImageUpload(event, (nextUrl) => setCityForm((current) => ({ ...current, heroImageUrl: nextUrl })))} />
                    </label>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">City profile fields</div>
                    <DynamicProfileEditor value={cityProfileData} onChange={setCityProfileData} />
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={saveCity} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700" disabled={saveCityState === 'saving'}>
                      {saveCityState === 'saving' ? 'Saving...' : isCreatingCity ? 'Create city' : 'Save city'}
                    </button>
                    <button type="button" onClick={resetCityForm} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset</button>
                    {selectedCity && !isCreatingCity ? <button type="button" onClick={() => void removeCity()} disabled={saveCityState === 'saving'} className="rounded-xl border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 dark:border-rose-900 dark:text-rose-300">Delete city</button> : null}
                    {isCreatingCity ? <button type="button" onClick={() => setIsCreatingCity(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700">Cancel</button> : null}
                  </div>
                  {saveCityMessage ? (
                    <p className={`mt-2 text-sm ${saveCityState === 'saved' ? 'text-emerald-600' : 'text-rose-600'}`} role="status" aria-live="polite">
                      {saveCityMessage}
                    </p>
                  ) : null}
                </>
              ) : (
                <div className="text-sm text-slate-500">
                  {selectedCityQuery.isLoading ? 'Loading city details…' : selectedCityQuery.isError ? <><p>City details could not be loaded.</p><button type="button" onClick={() => void selectedCityQuery.refetch()} className="mt-1 underline">Retry</button></> : 'Select a city to edit its profile, or create a city.'}
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Event data manager</h2>
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">{eventPagination?.total ?? 0}</span>
              <button type="button" disabled={!selectedCountryCode || isCreatingCountry} onClick={() => {
                setIsCreatingEvent(true);
                setSelectedEventSlug('');
                setEventForm(emptyEventForm(selectedCountryCode));
                setSaveEventState('idle');
                setSaveEventMessage('');
              }} className="rounded-xl bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50">Create event</button>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div>
              <input value={eventSearch} onChange={(event) => setEventSearch(event.target.value)} placeholder="Search event" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
              <div className="mt-4 space-y-2">
                {filteredEvents.slice(0, 12).map((event) => (
                  <button
                    key={event.slug}
                    type="button"
                    onClick={() => {
                      setIsCreatingEvent(false);
                      setSelectedEventSlug(event.slug);
                      setSaveEventState('idle');
                      setSaveEventMessage('');
                    }}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${selectedEventSlug === event.slug ? 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:border-cyan-500 dark:bg-cyan-500/10 dark:text-cyan-200' : 'border-slate-200 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:text-slate-300'}`}
                  >
                    <div className="font-medium">{event.title}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">{event.countryCode || 'N/A'}</div>
                  </button>
                ))}
              </div>
              {countryEventsQuery.isFetching ? <p className="mt-3 text-xs text-slate-500" role="status">Loading events…</p> : null}
              {!countryEventsQuery.isLoading && countryEventsQuery.isError ? <div className="mt-3 text-sm text-rose-600"><p>Events could not be loaded.</p><button type="button" onClick={() => void countryEventsQuery.refetch()} className="mt-1 underline">Retry</button></div> : null}
              {!countryEventsQuery.isLoading && !countryEventsQuery.isError && filteredEvents.length === 0 ? <p className="mt-3 text-sm text-slate-500">No events found.</p> : null}
              <PageControls page={eventPagination?.page ?? eventPage} totalPages={eventPagination?.totalPages ?? 1} onChange={setEventPage} />
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              {eventDeleteMessage ? <p role="status" aria-live="polite" className={`text-sm ${saveEventState === 'saved' ? 'text-emerald-600' : 'text-rose-600'}`}>{eventDeleteMessage}</p> : null}
              {selectedEvent || isCreatingEvent ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span>Event title</span>
                      <input value={eventForm.title} onChange={(event) => setEventForm((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
                    </label>
                    <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span>Image URL</span>
                      <input value={eventForm.image} onChange={(event) => setEventForm((current) => ({ ...current, image: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
                      <ImagePreview value={eventForm.image} label={`${eventForm.title} event`} />
                    </label>
                  </div>

                  <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="block">Upload new event image</span>
                    <label className="inline-flex cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 hover:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900">
                      <span>Choose file</span>
                      <input type="file" accept="image/*" className="sr-only" onChange={(event) => void handleImageUpload(event, (nextUrl) => setEventForm((current) => ({ ...current, image: nextUrl })))} />
                    </label>
                  </div>

                  <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    <span>Description</span>
                    <textarea value={eventForm.description} onChange={(event) => setEventForm((current) => ({ ...current, description: event.target.value }))} rows={4} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
                  </label>

                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span>Category</span>
                      <select value={eventForm.categoryId} onChange={(event) => setEventForm((current) => ({ ...current, categoryId: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                        <option value="">Select category</option>
                        {categories.map((category) => (
                          <option key={category.slug} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                      {categoriesQuery.isError ? <span className="block text-rose-600" role="status">Category choices failed to load. <button type="button" onClick={() => void categoriesQuery.refetch()} className="underline">Retry</button></span> : null}
                    </label>
                    <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span>Country code</span>
                      <input value={eventForm.countryCode} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60" />
                    </label>
                    <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span>City slug</span>
                      <select value={eventForm.citySlug} onChange={(event) => setEventForm((current) => ({ ...current, citySlug: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                        <option value="">No city</option>
                        {eventForm.citySlug && !cityList.some((city) => city.slug === eventForm.citySlug) ? <option value={eventForm.citySlug}>{eventForm.citySlug}</option> : null}
                        {cityList.map((city) => <option key={city.slug} value={city.slug}>{city.name}</option>)}
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span>Venue</span>
                      <input value={eventForm.venue} onChange={(event) => setEventForm((current) => ({ ...current, venue: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
                    </label>
                    <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span>Organizer</span>
                      <input value={eventForm.organizer} onChange={(event) => setEventForm((current) => ({ ...current, organizer: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
                    </label>
                    <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span>Province / region</span>
                      <input value={eventForm.province} onChange={(event) => setEventForm((current) => ({ ...current, province: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
                    </label>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Event source information</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                        <span>Source name</span>
                        <input value={eventForm.sourceName} onChange={(event) => setEventForm((current) => ({ ...current, sourceName: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
                      </label>
                      <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                        <span>Source URL</span>
                        <input type="url" value={eventForm.sourceUrl} onChange={(event) => setEventForm((current) => ({ ...current, sourceUrl: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
                      </label>
                      <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                        <span>Source type</span>
                        <input value={eventForm.sourceType} onChange={(event) => setEventForm((current) => ({ ...current, sourceType: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
                      </label>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                        <span>Primary source name</span>
                        <input value={eventForm.primarySourceName} onChange={(event) => setEventForm((current) => ({ ...current, primarySourceName: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
                      </label>
                      <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                        <span>Primary source URL</span>
                        <input type="url" value={eventForm.primarySourceUrl} onChange={(event) => setEventForm((current) => ({ ...current, primarySourceUrl: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
                      </label>
                      <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                        <span>Primary source type</span>
                        <input value={eventForm.primarySourceType} onChange={(event) => setEventForm((current) => ({ ...current, primarySourceType: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
                      </label>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                        <span>Discovery source name</span>
                        <input value={eventForm.discoverySourceName} onChange={(event) => setEventForm((current) => ({ ...current, discoverySourceName: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
                      </label>
                      <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                        <span>Discovery source URL</span>
                        <input type="url" value={eventForm.discoverySourceUrl} onChange={(event) => setEventForm((current) => ({ ...current, discoverySourceUrl: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
                      </label>
                    </div>
                  </div>

                  <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    <span>Tags</span>
                    <input value={eventForm.tags} onChange={(event) => setEventForm((current) => ({ ...current, tags: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span>Start</span>
                      <input type="datetime-local" value={eventForm.startAt} onChange={(event) => setEventForm((current) => ({ ...current, startAt: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
                    </label>
                    <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span>End</span>
                      <input type="datetime-local" value={eventForm.endAt} onChange={(event) => setEventForm((current) => ({ ...current, endAt: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={eventForm.dateOnly} onChange={(event) => setEventForm((current) => ({ ...current, dateOnly: event.target.checked }))} /> Date only</label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={eventForm.enabled} onChange={(event) => setEventForm((current) => ({ ...current, enabled: event.target.checked }))} /> Enabled</label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={eventForm.featured} onChange={(event) => setEventForm((current) => ({ ...current, featured: event.target.checked }))} /> Featured</label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={eventForm.trending} onChange={(event) => setEventForm((current) => ({ ...current, trending: event.target.checked }))} /> Trending</label>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={saveEvent} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700" disabled={saveEventState === 'saving'}>
                      {saveEventState === 'saving' ? 'Saving...' : isCreatingEvent ? 'Create event' : 'Save event'}
                    </button>
                    <button type="button" onClick={resetEventForm} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset</button>
                    {selectedEvent && !isCreatingEvent ? <button type="button" onClick={() => void removeEvent()} disabled={saveEventState === 'saving'} className="rounded-xl border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 dark:border-rose-900 dark:text-rose-300">Delete event</button> : null}
                    {isCreatingEvent ? <button type="button" onClick={() => setIsCreatingEvent(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700">Cancel</button> : null}
                  </div>
                  {saveEventMessage ? (
                    <p className={`mt-2 text-sm ${saveEventState === 'saved' ? 'text-emerald-600' : 'text-rose-600'}`} role="status" aria-live="polite">
                      {saveEventMessage}
                    </p>
                  ) : null}
                </>
              ) : (
                <div className="text-sm text-slate-500">
                  {selectedEventQuery.isLoading ? 'Loading event details…' : selectedEventQuery.isError ? <><p>Event details could not be loaded.</p><button type="button" onClick={() => void selectedEventQuery.refetch()} className="mt-1 underline">Retry</button></> : 'Select an event to edit it, or create an event.'}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
