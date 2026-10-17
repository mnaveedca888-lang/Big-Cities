import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { DataState } from '@/components/ui/data-state';
import { appRoutes } from '@/constants/routes';
import { golfCourseDirectory } from '@/data/golfCourses';
import { filterHiddenCategories, isCategoryHiddenByUi } from '@/services/catalog';
import type { CategoryItem, EventItem } from '@/types';

const fallbackDailyEventCategories = [
  'Art Exhibitions',
  'Concerts',
  'Conferences',
  'Cultural Celebration',
  'Dignitary Visits',
  'Educational Seminars',
  'Fashion Shows',
  'Film Festivals',
  'Food Festivals',
  'Government Events',
  'Sports Events',
  'Tech Events',
  'Theatre Shows',
  'Tourism & Travel',
] as const;

const pakistanGolfVenueOptions = [
  'Defence Raya Golf & Country Club — Lahore',
  'Royal Palm Golf & Country Club — Lahore',
  'Lahore Garrison Golf & Country Club — Lahore',
  'Lahore Gymkhana Golf Club — Lahore',
  'PAF Skyview Golf & Country Club — Lahore',
  'Karachi Golf Club — Karachi',
  'Defence Authority Country & Golf Club — Karachi',
  'Airmen Golf Club & Recreational Park — Karachi',
  'Arabian Sea Country Club — Karachi',
  'Rawalpindi Golf Club — Rawalpindi',
  'Islamabad Golf Club — Islamabad',
  'Margalla Greens Golf Club — Islamabad',
  'Chinar Golf Club — Bhurban',
  'Rumanza Golf & Country Club — Multan',
] as const;

function normalize(value: unknown) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function parseEventDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getEventInterval(event: EventItem) {
  const startAt = parseEventDate(event.startAt || event.date);
  const endAt = parseEventDate(event.endAt || event.startAt || event.date);
  return startAt && endAt ? { startAt, endAt } : null;
}

export function isHistoricalCatalogEvent(event: EventItem) {
  if (event.sourceName || event.sourceUrl) return false;
  return /Document date:|Historical\/cultural significance:/i.test(event.description || '');
}

export function isCurrentOrUpcoming(event: EventItem) {
  if (isHistoricalCatalogEvent(event)) return false;
  const interval = getEventInterval(event);
  if (!interval) return false;
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  return interval.endAt >= now && interval.startAt <= windowEnd;
}

function eventMatchesCategory(event: EventItem, category: string, categories: CategoryItem[]) {
  const eventCategory = event.category
    || categories.find((item) => item.id === event.categoryId)?.name
    || '';
  const normalizedCategory = normalize(category);
  const normalizedCategoryBase = normalizedCategory.replace(/s$/, '');
  const normalizedTags = Array.isArray(event.tags) ? event.tags : typeof event.tags === 'string' ? event.tags.split(',') : [];
  const normalizedVenue = normalize(event.venue || event.location);
  const venueMatches = normalizedVenue === normalizedCategory
    || normalizedVenue.includes(normalizedCategory)
    || normalize(event.venue || '').includes(normalizedCategoryBase);
  return normalize(eventCategory) === normalizedCategory
    || normalizedTags.some((tag) => {
      const normalizedTag = normalize(tag);
      return normalizedTag === normalizedCategory
        || normalizedTag === normalizedCategoryBase
        || normalizedTag.includes(normalizedCategory)
        || normalizedTag.includes(normalizedCategoryBase);
    })
    || venueMatches
    || normalize(eventCategory) === 'sports events' && normalizedTags.some((tag) => normalize(tag).includes(normalizedCategoryBase));
}

interface DailyEventsSectionProps {
  events: EventItem[];
  categories: CategoryItem[];
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export function DailyEventsSection({ events, categories, isLoading, error, onRetry }: DailyEventsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const visibleCategories = useMemo(() => filterHiddenCategories(categories), [categories]);
  const visibleEvents = useMemo(() => events.filter((event) => {
    const categoryName = event.category || visibleCategories.find((item) => item.id === event.categoryId)?.name || '';
    return !isCategoryHiddenByUi(categoryName);
  }), [events, visibleCategories]);

  const topLevelCategories = useMemo(() => {
    const names = visibleCategories.length > 0 ? visibleCategories.map((category) => category.name) : [...fallbackDailyEventCategories];
    const ordered: string[] = [];
    const seen = new Set<string>();

    for (const name of names) {
      const trimmed = name?.trim();
      if (!trimmed || seen.has(trimmed)) continue;
      if (normalize(trimmed) === 'golf courses' || normalize(trimmed) === 'golf course') continue;
      seen.add(trimmed);
      ordered.push(trimmed);
    }

    return ordered;
  }, [categories]);

  const sportsSubcategories = useMemo(() => {
    const knownSubcategories = ['Golf Courses', 'Cricket', 'Football', 'Tennis', 'Badminton', 'Basketball', 'Volleyball', 'Hockey', 'Athletics', 'Cycling', 'Boxing', 'Swimming', 'Squash', 'Table Tennis', 'Snooker'];
    const tags = new Set<string>(['Golf Courses']);

    for (const event of visibleEvents) {
      const resolvedCategory = event.category || visibleCategories.find((item) => item.id === event.categoryId)?.name || '';
      if (normalize(resolvedCategory) !== 'sports events') continue;
      const normalizedTags = Array.isArray(event.tags) ? event.tags : typeof event.tags === 'string' ? event.tags.split(',') : [];
      for (const tag of normalizedTags) {
        const normalizedTag = normalize(tag);
        if (!normalizedTag) continue;
        const match = knownSubcategories.find((label) => {
          const normalizedLabel = normalize(label);
          return normalizedLabel === normalizedTag
            || normalizedLabel.replace(/s$/, '') === normalizedTag
            || normalizedTag.includes(normalizedLabel)
            || normalizedTag.includes(normalizedLabel.replace(/s$/, ''));
        });
        if (match) tags.add(match);
      }
    }

    return [...new Set(knownSubcategories.filter((category) => tags.has(category)))];
  }, [visibleCategories, visibleEvents]);

  const golfVenueFilters = useMemo(
    () => [...golfCourseDirectory],
    [],
  );

  const activeCategoryFilter = selectedSubcategory && selectedCategory === 'Sports Events' ? selectedSubcategory : selectedCategory;

  const dailyEvents = useMemo(
    () => visibleEvents.filter(isCurrentOrUpcoming).filter((event) => !activeCategoryFilter || eventMatchesCategory(event, activeCategoryFilter, visibleCategories)),
    [activeCategoryFilter, visibleCategories, visibleEvents],
  );

  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Daily Events</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Current and upcoming events in Cities discovered from verified web sources.</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Daily event categories">
        <button type="button" aria-pressed={selectedCategory === null && selectedSubcategory === null} onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); }} className={`shrink-0 rounded-full border px-3 py-2 text-sm transition ${selectedCategory === null && selectedSubcategory === null ? 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300' : 'border-slate-200 text-slate-600 hover:border-cyan-400 dark:border-slate-800 dark:text-slate-400'}`}>All</button>
        {topLevelCategories.map((category) => (
          <button key={category} type="button" aria-pressed={selectedCategory === category && !selectedSubcategory} onClick={() => {
            setSelectedCategory(category);
            setSelectedSubcategory(category === 'Sports Events' ? 'Golf Courses' : null);
          }} className={`shrink-0 rounded-full border px-3 py-2 text-sm transition ${selectedCategory === category && !selectedSubcategory ? 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300' : 'border-slate-200 text-slate-600 hover:border-cyan-400 dark:border-slate-800 dark:text-slate-400'}`}>
            {category}
          </button>
        ))}
      </div>
      {selectedCategory === 'Sports Events' ? (
        <>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Sports subcategories">
            {sportsSubcategories.map((subcategory) => (
              <button key={subcategory} type="button" aria-pressed={selectedSubcategory === subcategory} onClick={() => {
                setSelectedCategory('Sports Events');
                setSelectedSubcategory(subcategory);
              }} className={`shrink-0 rounded-full border px-3 py-2 text-sm transition ${selectedSubcategory === subcategory ? 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300' : 'border-slate-200 text-slate-600 hover:border-cyan-400 dark:border-slate-800 dark:text-slate-400'}`}>
                {subcategory}
              </button>
            ))}
          </div>
          {selectedSubcategory === 'Golf Courses' ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">Golf Courses</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Explore golf events by venue</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{golfVenueFilters.length} venues</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Golf course venues">
                {golfVenueFilters.map((course) => {
                  const isSelected = selectedSubcategory === course.slug;

                  return (
                    <Link
                      key={course.slug}
                      to={appRoutes.golfCourseDetail(course.slug)}
                      aria-pressed={isSelected}
                      onClick={() => {
                        setSelectedCategory('Sports Events');
                        setSelectedSubcategory(course.slug);
                      }}
                      className={`group flex h-full min-h-[120px] w-full flex-col justify-between rounded-2xl border p-4 text-left align-top transition-all duration-200 ${isSelected ? 'border-cyan-500 bg-cyan-50 text-cyan-700 shadow-sm dark:border-cyan-400 dark:bg-cyan-500/10 dark:text-cyan-200' : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-400 hover:bg-cyan-50/40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-500 dark:hover:bg-cyan-500/10'}`}
                    >
                      <span className="text-base font-semibold leading-snug tracking-tight">{course.name}</span>
                      {course.city ? (
                        <span className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">{course.city}</span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
      <div className="mt-4">
        <DataState isLoading={isLoading} error={error} onRetry={onRetry} isEmpty={!isLoading && !error && dailyEvents.length === 0} emptyTitle="No daily events found" emptyDescription="There are no current or upcoming events in this category yet.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dailyEvents.map((event) => (
              <Link key={event.id} to={appRoutes.eventDetail(event.slug)} className="group flex min-h-[72px] items-center rounded-3xl border border-slate-200 bg-white/70 p-4 text-lg font-semibold text-slate-950 shadow-sm transition hover:-translate-y-1 hover:border-cyan-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70 dark:text-white">
                {event.title}
              </Link>
            ))}
          </div>
        </DataState>
      </div>
    </Card>
  );
}