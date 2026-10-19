import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { DataState } from '@/components/ui/data-state';
import { SEO } from '@/components/seo/SEO';
import { apiClient } from '@/api/client';
import { normalizeImageUrl } from '@/utils/imageValidation';
import { apiBaseUrl } from '@/config/runtime';
import { getCategories, getCountries, getCountryCities, updateCountry, updateCity } from '@/services/catalog';
import { getEvents, updateEvent } from '@/services/events';
import { getDashboardOverview } from '@/services/dashboard';
import type { CountryItem, CityItem, EventItem } from '@/types';
import { formatAreaValue, parseAreaInput } from '@/utils/format';

type CountryFormState = {
  name: string;
  code: string;
  heroImageUrl: string;
  flagImageUrl: string;
};

type CityFormState = {
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

function cloneValue(value: unknown): unknown {
  if (typeof value === 'undefined') return undefined;
  if (Array.isArray(value)) return value.map((item) => cloneValue(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, cloneValue(item)]));
  }
  return value;
}

function readCountryForm(country: CountryItem | null): CountryFormState {
  const profile = country?.profile && typeof country.profile === 'object' ? (country.profile as Record<string, unknown>) : {};
  return {
    name: country?.name ?? '',
    code: country?.code ?? '',
    heroImageUrl: typeof profile.heroImageUrl === 'string' ? profile.heroImageUrl : country?.image ?? '',
    flagImageUrl: typeof profile.flagImageUrl === 'string' ? profile.flagImageUrl : country?.flagImage ?? '',
  };
}

function readCityForm(city: CityItem | null, fallbackCountryCode: string): CityFormState {
  const profile = city?.profile && typeof city.profile === 'object' ? (city.profile as Record<string, unknown>) : {};
  return {
    name: city?.name ?? '',
    countryCode: city?.countryCode ?? fallbackCountryCode,
    heroImageUrl: typeof profile.heroImageUrl === 'string' ? profile.heroImageUrl : city?.image ?? '',
  };
}

function readEventForm(event: EventItem | null): EventFormState {
  return {
    title: event?.title ?? '',
    description: event?.description ?? '',
    categoryId: event && typeof event === 'object' && 'categoryId' in event ? String((event as any).categoryId ?? '') : '',
    countryCode: event?.countryCode ?? '',
    citySlug: event?.citySlug ?? '',
    startAt: event?.startAt ? new Date(event.startAt).toISOString().slice(0, 16) : '',
    endAt: event?.endAt ? new Date(event.endAt).toISOString().slice(0, 16) : '',
    tags: Array.isArray(event?.tags) ? event.tags.join(', ') : typeof event?.tags === 'string' ? event.tags : '',
    image: event?.image ?? '',
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

async function uploadImageFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<{ success: boolean; data?: Array<{ url: string }> }>('/uploads/files', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  const uploadedUrl = response.data?.data?.[0]?.url;
  if (!uploadedUrl) throw new Error('Upload failed');
  const localImageUrl = normalizeImageUrl(uploadedUrl);
  if (!localImageUrl) throw new Error('Upload returned a non-local image path');
  return localImageUrl;
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
  const overview = useQuery({ queryKey: ['dashboard-overview'], queryFn: getDashboardOverview });
  const countriesQuery = useQuery({
    queryKey: ['dashboard-countries'],
    queryFn: () => getCountries({ perPage: 500, sort: 'name' }),
  });
  const categoriesQuery = useQuery({
    queryKey: ['dashboard-categories'],
    queryFn: () => getCategories({ perPage: 200, sort: 'name' }),
  });

  const [countrySearch, setCountrySearch] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [countryForm, setCountryForm] = useState<CountryFormState>({ name: '', code: '', heroImageUrl: '', flagImageUrl: '' });
  const [countryProfileData, setCountryProfileData] = useState<Record<string, unknown>>({});
  const [saveCountryState, setSaveCountryState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveCountryMessage, setSaveCountryMessage] = useState('');

  const searchCountriesQuery = useQuery({
    queryKey: ['dashboard-countries-search', countrySearch],
    queryFn: () => getCountries({ q: countrySearch.trim() || undefined, perPage: 500, sort: 'name' }),
    enabled: Boolean(countrySearch.trim()),
    keepPreviousData: true,
  });

  const countries = countrySearch.trim() ? searchCountriesQuery.data?.items ?? [] : countriesQuery.data?.items ?? [];
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return countries;
    const query = countrySearch.toLowerCase();
    return countries.filter((country) => country.name.toLowerCase().includes(query) || country.code.toLowerCase().includes(query));
  }, [countries, countrySearch]);

  const selectedCountry = useMemo(
    () => countries.find((country) => country.code === selectedCountryCode) ?? null,
    [countries, selectedCountryCode],
  );

  const countryCitiesQuery = useQuery({
    queryKey: ['dashboard-country-cities', selectedCountryCode],
    queryFn: () => (selectedCountryCode ? getCountryCities(selectedCountryCode) : Promise.resolve([])),
    enabled: Boolean(selectedCountryCode),
  });

  const countryEventsQuery = useQuery({
    queryKey: ['dashboard-country-events', selectedCountryCode],
    queryFn: () => (selectedCountryCode ? getEvents({ country: selectedCountryCode, perPage: 200 }) : Promise.resolve([])),
    enabled: Boolean(selectedCountryCode),
  });

  const cityList = countryCitiesQuery.data ?? [];
  const eventList = countryEventsQuery.data ?? [];

  const [citySearch, setCitySearch] = useState('');
  const [selectedCitySlug, setSelectedCitySlug] = useState('');
  const [cityForm, setCityForm] = useState<CityFormState>({ name: '', countryCode: '', heroImageUrl: '' });
  const [cityProfileData, setCityProfileData] = useState<Record<string, unknown>>({});
  const [saveCityState, setSaveCityState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return cityList;
    const query = citySearch.toLowerCase();
    return cityList.filter((city) => city.name.toLowerCase().includes(query) || city.slug.toLowerCase().includes(query));
  }, [cityList, citySearch]);

  const selectedCity = useMemo(
    () => cityList.find((city) => city.slug === selectedCitySlug) ?? null,
    [cityList, selectedCitySlug],
  );

  const [eventSearch, setEventSearch] = useState('');
  const [selectedEventSlug, setSelectedEventSlug] = useState('');
  const [eventForm, setEventForm] = useState<EventFormState>({
    title: '',
    description: '',
    categoryId: '',
    countryCode: '',
    citySlug: '',
    startAt: '',
    endAt: '',
    tags: '',
    image: '',
    enabled: true,
    featured: false,
    trending: false,
  });
  const [saveEventState, setSaveEventState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const filteredEvents = useMemo(() => {
    if (!eventSearch.trim()) return eventList;
    const query = eventSearch.toLowerCase();
    return eventList.filter((event) => event.title.toLowerCase().includes(query) || (event.city || '').toLowerCase().includes(query));
  }, [eventList, eventSearch]);

  const selectedEvent = useMemo(
    () => eventList.find((event) => event.slug === selectedEventSlug) ?? null,
    [eventList, selectedEventSlug],
  );

  useEffect(() => {
    if (!selectedCountryCode && countries.length > 0) {
      setSelectedCountryCode(countries[0].code);
    }
  }, [countries, selectedCountryCode]);

  useEffect(() => {
    if (selectedCountry) {
      const nextCountryForm = readCountryForm(selectedCountry);
      setCountryForm(nextCountryForm);
      setCountryProfileData(buildCountryProfileState(selectedCountry));
      if (!selectedCitySlug && cityList[0]) {
        setSelectedCitySlug(cityList[0].slug);
      }
    }
  }, [selectedCountry, cityList, selectedCitySlug]);

  useEffect(() => {
    if (selectedCity) {
      const nextCityForm = readCityForm(selectedCity, selectedCountry?.code ?? '');
      setCityForm(nextCityForm);
      setCityProfileData(buildCityProfileState(selectedCity));
    }
  }, [selectedCity, selectedCountry]);

  useEffect(() => {
    if (selectedEvent) {
      setEventForm(readEventForm(selectedEvent));
    }
  }, [selectedEvent]);

  const saveCountry = async () => {
    if (!selectedCountry) return;
    try {
      setSaveCountryState('saving');
      setSaveCountryMessage('');
      const mergedProfile = { ...countryProfileData } as Record<string, unknown>;
      if (countryForm.heroImageUrl.trim()) mergedProfile.heroImageUrl = countryForm.heroImageUrl.trim();
      if (countryForm.flagImageUrl.trim()) mergedProfile.flagImageUrl = countryForm.flagImageUrl.trim();
      await updateCountry(selectedCountry.code, { name: countryForm.name, profile: mergedProfile });
      await countriesQuery.refetch();
      setSaveCountryState('saved');
      setSaveCountryMessage('Country updated successfully.');
    } catch (error) {
      console.error(error);
      setSaveCountryState('error');
      setSaveCountryMessage(error instanceof Error ? error.message : 'Unable to save country. Please try again.');
    }
  };

  const saveCity = async () => {
    if (!selectedCity) return;
    try {
      setSaveCityState('saving');
      const mergedProfile = { ...cityProfileData } as Record<string, unknown>;
      if (cityForm.heroImageUrl.trim()) mergedProfile.heroImageUrl = cityForm.heroImageUrl.trim();
      await updateCity(selectedCity.slug, {
        name: cityForm.name,
        countryCode: cityForm.countryCode || selectedCountry?.code || selectedCity.countryCode,
        profile: mergedProfile,
      });
      await countryCitiesQuery.refetch();
      setSaveCityState('saved');
    } catch (error) {
      console.error(error);
      setSaveCityState('error');
    }
  };

  const saveEvent = async () => {
    if (!selectedEvent) return;
    try {
      setSaveEventState('saving');
      const tags = eventForm.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
      await updateEvent(selectedEvent.slug, {
        title: eventForm.title,
        description: eventForm.description || null,
        categoryId: eventForm.categoryId || null,
        countryCode: eventForm.countryCode || selectedCountry?.code || null,
        citySlug: eventForm.citySlug || null,
        startAt: eventForm.startAt ? new Date(eventForm.startAt).toISOString() : undefined,
        endAt: eventForm.endAt ? new Date(eventForm.endAt).toISOString() : undefined,
        tags: tags.length ? tags : [],
        image: eventForm.image || null,
        enabled: eventForm.enabled,
        featured: eventForm.featured,
        trending: eventForm.trending,
      });
      await countryEventsQuery.refetch();
      setSaveEventState('saved');
    } catch (error) {
      console.error(error);
      setSaveEventState('error');
    }
  };

  const resetCountryForm = () => {
    if (selectedCountry) {
      const nextCountryForm = readCountryForm(selectedCountry);
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
    if (selectedCity) {
      const nextCityForm = readCityForm(selectedCity, selectedCountry?.code ?? '');
      setCityForm(nextCityForm);
      setCityProfileData(buildCityProfileState(selectedCity));
    }
  };

  const resetEventForm = () => {
    if (selectedEvent) {
      setEventForm(readEventForm(selectedEvent));
    }
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>, onApply: (nextUrl: string) => void) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImageFile(file);
      onApply(url);
    } catch (error) {
      console.error(error);
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
          <p className="mt-3 text-slate-600 dark:text-slate-400">Edit the live country, city, and event data using field-by-field forms rather than raw JSON.</p>
        </div>

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
            <span className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">{filteredCountries.length}</span>
          </div>
          <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div>
              <input value={countrySearch} onChange={(event) => setCountrySearch(event.target.value)} placeholder="Search country" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
              <div className="mt-4 space-y-2">
                {filteredCountries.slice(0, 12).map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => setSelectedCountryCode(country.code)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${selectedCountryCode === country.code ? 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:border-cyan-500 dark:bg-cyan-500/10 dark:text-cyan-200' : 'border-slate-200 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:text-slate-300'}`}
                  >
                    <span>{country.name}</span>
                    <span className="text-xs uppercase tracking-[0.2em]">{country.code}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              {selectedCountry ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span>Country name</span>
                      <input value={countryForm.name} onChange={(event) => setCountryForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
                    </label>
                    <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span>Country code</span>
                      <input value={countryForm.code} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60" />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span>Hero image</span>
                      <input value={countryForm.heroImageUrl} onChange={(event) => setCountryForm((current) => ({ ...current, heroImageUrl: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
                    </label>
                    <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className="block">Upload new hero image</span>
                      <label className="inline-flex cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 hover:border-cyan-500 dark:border-slate-700 dark:bg-slate-900">
                        <span>Choose file</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(event) => void handleImageUpload(event, (nextUrl) => setCountryForm((current) => ({ ...current, heroImageUrl: nextUrl })))} />
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span>Flag image</span>
                      <input value={countryForm.flagImageUrl} onChange={(event) => setCountryForm((current) => ({ ...current, flagImageUrl: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
                    </label>
                    <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className="block">Upload new flag image</span>
                      <label className="inline-flex cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 hover:border-cyan-500 dark:border-slate-700 dark:bg-slate-900">
                        <span>Choose file</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(event) => void handleImageUpload(event, (nextUrl) => setCountryForm((current) => ({ ...current, flagImageUrl: nextUrl })))} />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Profile fields</div>
                    <DynamicProfileEditor value={countryProfileData} onChange={setCountryProfileData} />
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={saveCountry} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700" disabled={saveCountryState === 'saving'}>
                      {saveCountryState === 'saving' ? 'Saving...' : 'Save country'}
                    </button>
                    <button type="button" onClick={resetCountryForm} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset</button>
                  </div>
                  {saveCountryMessage ? (
                    <p className={`mt-2 text-sm ${saveCountryState === 'saved' ? 'text-emerald-600' : 'text-rose-600'}`} role="status" aria-live="polite">
                      {saveCountryMessage}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-slate-500">Select a country to edit its data.</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">City data manager</h2>
            <span className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">{filteredCities.length}</span>
          </div>
          <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div>
              <input value={citySearch} onChange={(event) => setCitySearch(event.target.value)} placeholder="Search city" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
              <div className="mt-4 space-y-2">
                {filteredCities.slice(0, 12).map((city) => (
                  <button
                    key={city.slug}
                    type="button"
                    onClick={() => setSelectedCitySlug(city.slug)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${selectedCitySlug === city.slug ? 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:border-cyan-500 dark:bg-cyan-500/10 dark:text-cyan-200' : 'border-slate-200 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:text-slate-300'}`}
                  >
                    <span>{city.name}</span>
                    <span className="text-[10px] uppercase tracking-[0.2em]">{city.countryCode}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              {selectedCity ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span>City name</span>
                      <input value={cityForm.name} onChange={(event) => setCityForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
                    </label>
                    <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span>Country code</span>
                      <input value={cityForm.countryCode} onChange={(event) => setCityForm((current) => ({ ...current, countryCode: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm text-slate-700 dark:text-slate-300">
                      <span>Hero image</span>
                      <input value={cityForm.heroImageUrl} onChange={(event) => setCityForm((current) => ({ ...current, heroImageUrl: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
                    </label>
                    <label className="inline-flex cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:border-cyan-500 dark:border-slate-700 dark:bg-slate-900">
                      <span>Upload new image</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(event) => void handleImageUpload(event, (nextUrl) => setCityForm((current) => ({ ...current, heroImageUrl: nextUrl })))} />
                    </label>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">City profile fields</div>
                    <DynamicProfileEditor value={cityProfileData} onChange={setCityProfileData} />
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={saveCity} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700" disabled={saveCityState === 'saving'}>
                      {saveCityState === 'saving' ? 'Saving...' : 'Save city'}
                    </button>
                    <button type="button" onClick={resetCityForm} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset</button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">Select a city to edit its profile.</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Event data manager</h2>
            <span className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">{filteredEvents.length}</span>
          </div>
          <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div>
              <input value={eventSearch} onChange={(event) => setEventSearch(event.target.value)} placeholder="Search event" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
              <div className="mt-4 space-y-2">
                {filteredEvents.slice(0, 12).map((event) => (
                  <button
                    key={event.slug}
                    type="button"
                    onClick={() => setSelectedEventSlug(event.slug)}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${selectedEventSlug === event.slug ? 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:border-cyan-500 dark:bg-cyan-500/10 dark:text-cyan-200' : 'border-slate-200 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:text-slate-300'}`}
                  >
                    <div className="font-medium">{event.title}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">{event.countryCode || 'N/A'}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              {selectedEvent ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span>Event title</span>
                      <input value={eventForm.title} onChange={(event) => setEventForm((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
                    </label>
                    <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span>Image URL</span>
                      <input value={eventForm.image} onChange={(event) => setEventForm((current) => ({ ...current, image: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
                    </label>
                  </div>

                  <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="block">Upload new event image</span>
                    <label className="inline-flex cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 hover:border-cyan-500 dark:border-slate-700 dark:bg-slate-900">
                      <span>Choose file</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(event) => void handleImageUpload(event, (nextUrl) => setEventForm((current) => ({ ...current, image: nextUrl })))} />
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
                        {(categoriesQuery.data?.items ?? []).map((category) => (
                          <option key={category.slug} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span>Country code</span>
                      <input value={eventForm.countryCode} onChange={(event) => setEventForm((current) => ({ ...current, countryCode: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
                    </label>
                    <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <span>City slug</span>
                      <input value={eventForm.citySlug} onChange={(event) => setEventForm((current) => ({ ...current, citySlug: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
                    </label>
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
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={eventForm.enabled} onChange={(event) => setEventForm((current) => ({ ...current, enabled: event.target.checked }))} /> Enabled</label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={eventForm.featured} onChange={(event) => setEventForm((current) => ({ ...current, featured: event.target.checked }))} /> Featured</label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={eventForm.trending} onChange={(event) => setEventForm((current) => ({ ...current, trending: event.target.checked }))} /> Trending</label>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={saveEvent} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700" disabled={saveEventState === 'saving'}>
                      {saveEventState === 'saving' ? 'Saving...' : 'Save event'}
                    </button>
                    <button type="button" onClick={resetEventForm} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset</button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">Select an event to edit it.</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

