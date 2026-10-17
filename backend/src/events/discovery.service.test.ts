import { afterEach, describe, expect, it, vi } from 'vitest';
import { mapCategory, PAKISTAN_GOLF_VENUES } from './ingestion/categories';
import { DAILY_EVENT_CATEGORIES, buildDiscoveryQuery, buildDiscoveryQueries, dayStartUtc, discoverAndStoreEvents, extractVisibleContentEvent, isWithin48HourWindow, parseYouSearchResponse, reserveDailySearch, selectOldestCategory, windowStartUtc } from './discovery.service';

function createPrisma() {
  const states = new Map<string, any>();
  const budgets = new Map<string, any>();
  const categories = new Map<string, any>();
  const events: any[] = [];
  const prisma: any = {
    eventDiscoveryState: {
      findMany: vi.fn(async ({ where }: any) => [...states.values()].filter((state) => state.countryCode === where.countryCode && where.category.in.includes(state.category))),
      upsert: vi.fn(async ({ where, create, update }: any) => {
        const key = `${where.countryCode_category.countryCode}:${where.countryCode_category.category}`;
        const value = states.get(key) ? { ...states.get(key), ...update } : { id: key, ...create };
        states.set(key, value);
        return value;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const key = `${where.countryCode_category.countryCode}:${where.countryCode_category.category}`;
        const value = { ...states.get(key), ...data };
        states.set(key, value);
        return value;
      }),
    },
    eventDiscoveryBudget: {
      findUnique: vi.fn(async ({ where }: any) => budgets.get(`${where.countryCode_utcDate.countryCode}:${where.countryCode_utcDate.utcDate.toISOString()}`) ?? null),
      findMany: vi.fn(async ({ where }: any) => {
        const rows = [...budgets.values()];
        const country = where?.countryCode ?? null;
        const dayStart = where?.utcDate?.gte ?? null;
        const dayEnd = where?.utcDate?.lt ?? null;
        return rows.filter((entry) => {
          const matchesCountry = !country || entry.countryCode === country;
          const matchesDay = (!dayStart || entry.utcDate >= dayStart) && (!dayEnd || entry.utcDate < dayEnd);
          return matchesCountry && matchesDay;
        });
      }),
      create: vi.fn(async ({ data }: any) => {
        const key = `${data.countryCode}:${data.utcDate.toISOString()}`;
        const value = { id: key, ...data };
        budgets.set(key, value);
        return value;
      }),
      updateMany: vi.fn(async ({ where, data }: any) => {
        const value = [...budgets.values()].find((entry) => entry.id === where.id && entry.searchCount < where.searchCount.lt);
        if (!value) return { count: 0 };
        value.searchCount += data.searchCount.increment;
        return { count: 1 };
      }),
    },
    $transaction: vi.fn(async (callback: any) => callback(prisma)),
    city: { findMany: vi.fn().mockResolvedValue([{ slug: 'pk-lahore', name: 'Lahore' }]) },
    category: { upsert: vi.fn(async ({ create }: any) => { categories.set(create.slug, { id: create.slug, ...create }); return categories.get(create.slug); }) },
    event: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn(async ({ data }: any) => { const event = { id: String(events.length + 1), ...data }; events.push(event); return event; }),
      update: vi.fn(),
    },
    __states: states,
    __budgets: budgets,
    __events: events,
  };
  return prisma;
}

function searchResponses(results: any[] = []) {
  return [
    new Response('', { status: 200 }),
    new Response('', { status: 202 }),
    new Response(`data: ${JSON.stringify({ result: { content: [{ type: 'text', text: JSON.stringify({ results: { web: results } }) }] } })}\n`, { status: 200 }),
  ];
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.EVENT_DISCOVERY_DAILY_LIMIT;
  delete process.env.EVENT_DISCOVERY_QUERY;
});

describe('persistent You.com discovery rotation', () => {
  it('keeps an event that is already in progress today inside the 48-hour window', () => {
    const now = new Date('2026-09-17T12:00:00.000Z');
    expect(isWithin48HourWindow(new Date('2026-09-17T00:00:00.000Z'), new Date('2026-09-17T23:59:59.999Z'), now)).toBe(true);
    expect(isWithin48HourWindow(new Date('2026-09-19T13:00:00.000Z'), new Date('2026-09-19T14:00:00.000Z'), now)).toBe(false);
  });

  it('allows 39 daily searches when the current six-hour window is empty', async () => {
    process.env.EVENT_DISCOVERY_DAILY_LIMIT = '100';
    const prisma = createPrisma();
    const now = new Date('2026-09-11T08:04:00.000Z');
    prisma.__budgets.set('PK:2026-09-11T00:00:00.000Z', { id: 'day', countryCode: 'PK', utcDate: dayStartUtc(now), searchCount: 39 });
    expect(await reserveDailySearch(prisma, 'PK', now)).toBe(true);
    expect(prisma.__budgets.get('PK:2026-09-11T06:00:00.000Z').searchCount).toBe(1);
  });

  it('allows 99 daily searches when the current window has 19 searches', async () => {
    process.env.EVENT_DISCOVERY_DAILY_LIMIT = '100';
    const prisma = createPrisma();
    const now = new Date('2026-09-11T08:04:00.000Z');
    prisma.__budgets.set('PK:2026-09-11T00:00:00.000Z', { id: 'day', countryCode: 'PK', utcDate: dayStartUtc(now), searchCount: 80 });
    prisma.__budgets.set('PK:2026-09-11T06:00:00.000Z', { id: 'window', countryCode: 'PK', utcDate: windowStartUtc(now), searchCount: 19 });
    expect(await reserveDailySearch(prisma, 'PK', now)).toBe(true);
    expect(prisma.__budgets.get('PK:2026-09-11T06:00:00.000Z').searchCount).toBe(20);
  });

  it('blocks at the daily limit of 100', async () => {
    process.env.EVENT_DISCOVERY_DAILY_LIMIT = '100';
    const prisma = createPrisma();
    const now = new Date('2026-09-11T08:04:00.000Z');
    prisma.__budgets.set('PK:2026-09-11T00:00:00.000Z', { id: 'day', countryCode: 'PK', utcDate: dayStartUtc(now), searchCount: 100 });
    expect(await reserveDailySearch(prisma, 'PK', now)).toBe(false);
  });

  it('blocks when the current six-hour window has 20 searches', async () => {
    process.env.EVENT_DISCOVERY_DAILY_LIMIT = '100';
    const prisma = createPrisma();
    const now = new Date('2026-09-11T08:04:00.000Z');
    prisma.__budgets.set('PK:2026-09-11T00:00:00.000Z', { id: 'day', countryCode: 'PK', utcDate: dayStartUtc(now), searchCount: 79 });
    prisma.__budgets.set('PK:2026-09-11T06:00:00.000Z', { id: 'window', countryCode: 'PK', utcDate: windowStartUtc(now), searchCount: 20 });
    expect(await reserveDailySearch(prisma, 'PK', now)).toBe(false);
  });

  it('allows a 13:04 PKT startup reservation using UTC day/window boundaries', async () => {
    process.env.EVENT_DISCOVERY_DAILY_LIMIT = '100';
    const prisma = createPrisma();
    const pkTime = new Date('2026-09-11T13:04:00+05:00');
    prisma.__budgets.set('PK:2026-09-11T00:00:00.000Z', { id: 'day', countryCode: 'PK', utcDate: dayStartUtc(pkTime), searchCount: 39 });
    expect(await reserveDailySearch(prisma, 'PK', pkTime)).toBe(true);
    expect(windowStartUtc(pkTime).toISOString()).toBe('2026-09-11T06:00:00.000Z');
  });

  it('selects the correct UTC day and six-hour window boundaries', () => {
    const now = new Date('2026-09-11T13:04:00+05:00');
    expect(dayStartUtc(now).toISOString()).toBe('2026-09-11T00:00:00.000Z');
    expect(windowStartUtc(now).toISOString()).toBe('2026-09-11T06:00:00.000Z');
    expect(windowStartUtc(new Date('2026-09-11T17:59:59.999Z')).toISOString()).toBe('2026-09-11T12:00:00.000Z');
  });

  it('requires explicit country evidence for visible-content events', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-17T12:00:00.000Z'));
    const cities = [{ slug: 'pk-lahore', name: 'Lahore' }];
    const result = { title: 'Agri-Connections 2026 Lahore | Agriculture & AgriTech Event' };
    const valid = '<h1>Agri-Connections 2026 Lahore | Agriculture &amp; AgriTech Event</h1><p>Taking place in Lahore, Pakistan from Thursday, October 1 to Friday, October 2, 2026.</p>';
    const validRange = '<h1>Pakistan Moto Show 2026</h1><p>Pakistan motorsport festival in Lahore, Pakistan. Date: October 1-2, 2026.</p>';
    const incidentalCity = '<h1>Agri-Connections 2026 Lahore | Agriculture &amp; AgriTech Event</h1><p>Lahore, Pakistan is mentioned in an unrelated archive.</p><p>The event takes place in Delhi, India from Thursday, October 1 to Friday, October 2, 2026.</p>';
    const ambiguous = '<h1>Agri-Connections 2026 Lahore | Agriculture & AgriTech Event</h1><p>Taking place in Lahore from Thursday, October 1 to Friday, October 2, 2026.</p>';
    expect(extractVisibleContentEvent(valid, result, cities, { code: 'PK', name: 'Pakistan' })).not.toBeNull();
    expect(extractVisibleContentEvent(validRange, result, cities, { code: 'PK', name: 'Pakistan' })).not.toBeNull();
    expect(extractVisibleContentEvent(incidentalCity, result, cities, { code: 'PK', name: 'Pakistan' })).toBeNull();
    expect(extractVisibleContentEvent(ambiguous, result, cities, { code: 'PK', name: 'Pakistan' })).toBeNull();
    expect(extractVisibleContentEvent('<h1>Agri-Connections 2026 Lahore | Agriculture & AgriTech Event</h1><p>October 1 to October 2, 2026.</p>', result, cities, { code: 'PK', name: 'Pakistan' })).toBeNull();
  });

  it('keeps visible date-only events aligned to Pakistan local-day boundaries', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-17T12:00:00.000Z'));
    const event = extractVisibleContentEvent(
      '<h1>Pakistan Technology Expo Lahore</h1><p>Pakistan technology event in Lahore on September 18, 2026.</p>',
      { title: 'Pakistan Technology Expo Lahore' },
      [{ slug: 'pk-lahore', name: 'Lahore' }],
      { code: 'PK', name: 'Pakistan' },
    );
    expect(event?.startAt.toISOString()).toBe('2026-09-17T19:00:00.000Z');
    expect(event?.endAt.toISOString()).toBe('2026-09-18T18:59:59.999Z');
  });

  it('extracts a current Karachi venue event with day-first multi-day dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-17T12:00:00.000Z'));
    const event = extractVisibleContentEvent(
      '<h1>Home | Pakistan Lifestyle Furniture Expo</h1><p>Upcoming Event Karachi Furniture Exhibition 2026. Date 18-19-20 September 2026. Venue Expo Centre, Karachi. Pakistan.</p>',
      { title: 'Home | Pakistan Lifestyle Furniture Expo', url: 'https://www.plfe.com.pk/' },
      [{ slug: 'pk-lahore', name: 'Lahore' }, { slug: 'pk-karachi', name: 'Karachi' }],
      { code: 'PK', name: 'Pakistan' },
    );
    expect(event?.title).toBe('Karachi Furniture Exhibition 2026');
    expect(event?.city.name).toBe('Karachi');
    expect(event?.category).toBe('Art Exhibitions');
    expect(event?.startAt.toISOString()).toBe('2026-09-17T19:00:00.000Z');
    expect(event?.endAt.toISOString()).toBe('2026-09-20T18:59:59.999Z');
  });

  it('supports the clean hierarchy and adds explicit tourism/conference discovery', () => {
    expect(DAILY_EVENT_CATEGORIES).toEqual(expect.arrayContaining(['Sports Events', 'Tourism & Travel', 'Conferences', 'Cultural Celebration']));
    expect(DAILY_EVENT_CATEGORIES).toHaveLength(14);
    expect(DAILY_EVENT_CATEGORIES).not.toContain('Golf Courses');
    const golfQuery = buildDiscoveryQuery({ name: 'Pakistan' }, 'Sports Events', ['Lahore', 'Karachi'], new Date('2026-09-08T00:00:00Z'));
    const tourismQuery = buildDiscoveryQuery({ name: 'Pakistan' }, 'Tourism & Travel', ['Lahore', 'Karachi'], new Date('2026-09-08T00:00:00Z'));
    const conferenceQuery = buildDiscoveryQuery({ name: 'Pakistan' }, 'Conferences', ['Lahore', 'Karachi'], new Date('2026-09-08T00:00:00Z'));
    const culturalQuery = buildDiscoveryQuery({ name: 'Pakistan' }, 'Cultural Celebration', ['Lahore', 'Karachi'], new Date('2026-09-08T00:00:00Z'));
    for (const venue of PAKISTAN_GOLF_VENUES) {
      expect(golfQuery).toContain(venue);
    }
    expect(golfQuery).toContain('golf tournament');
    expect(tourismQuery).toContain('tourism festival travel expo');
    expect(conferenceQuery).toContain('conference summit forum');
    expect(culturalQuery).toContain('cultural festival celebration');
    expect(culturalQuery).toContain('events today');
    expect(culturalQuery).toContain('events tomorrow');
    expect(mapCategory('Pakistan Open Golf Championship 2026', 'A major golf tournament in Lahore')).toBe('Sports Events');
    expect(mapCategory('Pakistan Tourism Festival 2026', 'A tourism festival in Islamabad')).toBe('Tourism & Travel');
    expect(mapCategory('Pakistan AI Conference 2026', 'Technology conference in Karachi')).toBe('Tech Events');
    expect(mapCategory('Pakistan Heritage Festival 2026', 'Cultural celebration in Lahore')).toBe('Cultural Celebration');
  });

  it('builds a focused query for every supported category and covers required cities', () => {
    for (const category of DAILY_EVENT_CATEGORIES) {
      const query = buildDiscoveryQuery({ name: 'Pakistan' }, category, []);
      expect(query).toContain(`"${category}"`);
      expect(query).toContain('Lahore');
      expect(query).toContain('Hyderabad');
      expect(query).toContain('upcoming');
    }
  });

  it('builds multiple human-style queries for every supported category', () => {
    for (const category of DAILY_EVENT_CATEGORIES) {
      const queries = buildDiscoveryQueries({ name: 'Pakistan' }, category, []);
      expect(queries).toHaveLength(20);
      expect(queries.join(' ')).toContain('Pakistan');
      expect(queries.join(' ')).toContain('Lahore');
      expect(queries.join(' ')).toContain('Karachi');
      expect(queries.join(' ')).toContain('Islamabad');
      expect(queries.some((query) => query.includes('Lahore') && query.includes('2026'))).toBe(true);
      expect(queries.some((query) => query.includes('Karachi') && query.includes('2026'))).toBe(true);
      expect(queries.some((query) => query.includes('site:.pk'))).toBe(true);
      expect(queries.some((query) => query.includes('today'))).toBe(true);
      expect(queries.every((query) => query.includes('today') || query.includes('tomorrow') || query.includes('next 48 hours'))).toBe(true);
      expect(queries.every((query) => query.includes('-weather') && query.includes('-news'))).toBe(true);
    }
  });

  it('parses You.com search results after informational SSE frames', () => {
    const response = [
      `data: ${JSON.stringify({ result: { content: [{ type: 'text', text: 'search started' }] } })}`,
      `data: ${JSON.stringify({ result: { content: [{ type: 'text', text: JSON.stringify({ results: { web: [{ title: 'Lahore Event', url: 'https://example.com/event' }] } }) }] } })}`,
    ].join('\n');
    expect(parseYouSearchResponse(response)).toEqual([{ title: 'Lahore Event', url: 'https://example.com/event' }]);
  });

  it('selects never-searched categories before searched categories and then the oldest timestamp', async () => {
    const prisma = createPrisma();
    prisma.__states.set('PK:Concerts', { countryCode: 'PK', category: 'Concerts', lastAttemptedAt: new Date('2026-09-07T00:00:00Z') });
    prisma.__states.set('PK:Tech Events', { countryCode: 'PK', category: 'Tech Events', lastAttemptedAt: new Date('2026-09-08T00:00:00Z') });
    expect(await selectOldestCategory(prisma, 'PK')).toBe('Art Exhibitions');
    prisma.__states.set('PK:Art Exhibitions', { countryCode: 'PK', category: 'Art Exhibitions', lastAttemptedAt: new Date('2026-09-09T00:00:00Z') });
    expect(await selectOldestCategory(prisma, 'PK')).toBe('Conferences');
  });

  it('rotates independently for different countries and survives a service restart', async () => {
    const prisma = createPrisma();
    prisma.__states.set('PK:Concerts', { countryCode: 'PK', category: 'Concerts', lastAttemptedAt: new Date('2026-09-07T00:00:00Z') });
    prisma.__states.set('AZ:Tech Events', { countryCode: 'AZ', category: 'Tech Events', lastAttemptedAt: new Date('2026-09-07T00:00:00Z') });
    expect(await selectOldestCategory(prisma, 'PK')).toBe('Art Exhibitions');
    expect(await selectOldestCategory(prisma, 'AZ')).toBe('Art Exhibitions');
    prisma.__states.set('PK:Art Exhibitions', { countryCode: 'PK', category: 'Art Exhibitions', lastAttemptedAt: new Date('2026-09-08T00:00:00Z') });
    for (const category of DAILY_EVENT_CATEGORIES) {
      if (!['Concerts', 'Art Exhibitions'].includes(category)) prisma.__states.set(`PK:${category}`, { countryCode: 'PK', category, lastAttemptedAt: new Date('2026-09-09T00:00:00Z') });
    }
    expect(await selectOldestCategory(prisma, 'PK')).toBe('Concerts');
  });

  it('records the attempt and zero result count for a zero-result search', async () => {
    process.env.EVENT_DISCOVERY_DAILY_LIMIT = '1';
    const prisma = createPrisma();
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => searchResponses().shift()));
    const result = await discoverAndStoreEvents(prisma, { code: 'PK', name: 'Pakistan' }, 'Concerts');
    const state = prisma.__states.get('PK:Concerts');
    expect(result.stored).toBe(0);
    expect(state.lastAttemptedAt).toBeInstanceOf(Date);
    expect(state.lastSuccessfulAt).toBeNull();
    expect(state.lastResultCount).toBe(0);
  });

  it('records an attempt when the real search fails after budget reservation', async () => {
    process.env.EVENT_DISCOVERY_DAILY_LIMIT = '1';
    const prisma = createPrisma();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('You.com unavailable')));
    await expect(discoverAndStoreEvents(prisma, { code: 'AZ', name: 'Azerbaijan' }, 'Concerts')).rejects.toThrow('You.com unavailable');
    expect(prisma.__states.get('AZ:Concerts').lastAttemptedAt).toBeInstanceOf(Date);
    expect(prisma.__states.get('AZ:Concerts').lastSuccessfulAt).toBeUndefined();
  });

  it('prevents a second country search on the same UTC day', async () => {
    process.env.EVENT_DISCOVERY_DAILY_LIMIT = '1';
    const prisma = createPrisma();
    const fetch = vi.fn().mockImplementation(async () => searchResponses().shift());
    vi.stubGlobal('fetch', fetch);
    await discoverAndStoreEvents(prisma, { code: 'QA', name: 'Qatar' }, 'Concerts');
    const second = await discoverAndStoreEvents(prisma, { code: 'QA', name: 'Qatar' }, 'Tech Events');
    expect(second.budgetReached).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('stops multi-query discovery at the configured six-hour limit', async () => {
    process.env.EVENT_DISCOVERY_DAILY_LIMIT = '20';
    const prisma = createPrisma();
    const fetch = vi.fn().mockImplementation(async () => searchResponses().shift());
    vi.stubGlobal('fetch', fetch);
    for (const category of DAILY_EVENT_CATEGORIES) {
      const result = await discoverAndStoreEvents(prisma, { code: 'QZ', name: 'Qatar Test' }, category);
      if (result.budgetReached) break;
    }
    expect(fetch).toHaveBeenCalledTimes(20 * 3);
    expect(prisma.__budgets.values().next().value.searchCount).toBe(20);
  });

  it('caps each six-hour window at 20 and the entire day at 100', async () => {
    process.env.EVENT_DISCOVERY_DAILY_LIMIT = '100';
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-10T00:00:00Z'));
    const prisma = createPrisma();
    const fetch = vi.fn().mockImplementation(async () => searchResponses().shift());
    vi.stubGlobal('fetch', fetch);

    for (let index = 0; index < 20; index += 1) {
      const category = `Window A ${index}` as any;
      const result = await discoverAndStoreEvents(prisma, { code: 'PK', name: 'Pakistan' }, category);
      if (result.budgetReached) break;
    }

    const atWindowLimit = await discoverAndStoreEvents(prisma, { code: 'PK', name: 'Pakistan' }, 'Window A overflow' as any);
    expect(atWindowLimit.budgetReached).toBe(true);

    vi.setSystemTime(new Date('2026-09-10T06:00:00Z'));
    for (let index = 0; index < 20; index += 1) {
      const category = `Window B ${index}` as any;
      const result = await discoverAndStoreEvents(prisma, { code: 'PK', name: 'Pakistan' }, category);
      if (result.budgetReached) break;
    }

    const nextWindowLimit = await discoverAndStoreEvents(prisma, { code: 'PK', name: 'Pakistan' }, 'Window B overflow' as any);
    expect(nextWindowLimit.budgetReached).toBe(true);

    vi.setSystemTime(new Date('2026-09-11T00:00:00Z'));
    const nextDay = await discoverAndStoreEvents(prisma, { code: 'PK', name: 'Pakistan' }, 'Next Day Search' as any);
    expect(nextDay.budgetReached).toBeUndefined();

    expect(fetch).toHaveBeenCalledTimes(180);
    vi.useRealTimers();
  });

  it('uses the default daily budget of 100 searches when no override is set', async () => {
    delete process.env.EVENT_DISCOVERY_DAILY_LIMIT;
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-10T00:00:00Z'));
    const prisma = createPrisma();
    const fetch = vi.fn().mockImplementation(async () => searchResponses().shift());
    vi.stubGlobal('fetch', fetch);

    for (let index = 0; index < 20; index += 1) {
      const result = await discoverAndStoreEvents(prisma, { code: 'PK', name: 'Pakistan' }, `Default Budget ${index}` as any);
      if (result.budgetReached) break;
    }

    const firstWindowBlocked = await discoverAndStoreEvents(prisma, { code: 'PK', name: 'Pakistan' }, 'Default Budget Overflow 1' as any);
    expect(firstWindowBlocked.budgetReached).toBe(true);

    vi.setSystemTime(new Date('2026-09-10T06:00:00Z'));
    for (let index = 0; index < 20; index += 1) {
      const result = await discoverAndStoreEvents(prisma, { code: 'PK', name: 'Pakistan' }, `Default Budget 6h ${index}` as any);
      if (result.budgetReached) break;
    }

    const secondWindowBlocked = await discoverAndStoreEvents(prisma, { code: 'PK', name: 'Pakistan' }, 'Default Budget Overflow 2' as any);
    expect(secondWindowBlocked.budgetReached).toBe(true);

    expect(fetch).toHaveBeenCalledTimes(40 * 3);
    vi.useRealTimers();
  });
});
