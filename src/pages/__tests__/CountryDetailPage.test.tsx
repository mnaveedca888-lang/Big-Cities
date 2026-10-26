import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CountryDetailPage from '../CountryDetailPage';

vi.mock('@/components/features/DailyEventsSection', () => ({
  DailyEventsSection: ({ events }: { events: Array<{ id?: string; slug?: string; title?: string }> }) => (
    <section aria-label="Daily Events">
      <h2>Daily Events</h2>
      {events.map((event) => <a key={event.id} href={`/event/${event.slug}`}>{event.title}</a>)}
    </section>
  ),
  isHistoricalCatalogEvent: (event: { sourceName?: string | null; sourceUrl?: string | null; description?: string | null }) => {
    if (event.sourceName || event.sourceUrl) return false;
    return /Document date:|Historical\/cultural significance:/i.test(event.description || '');
  },
}));

const mockGetCountry = vi.fn();
const mockGetCountryCities = vi.fn();
const mockGetEvents = vi.fn();
const mockGetCategories = vi.fn();

vi.mock('@/services/catalog', () => ({
  getCountry: (...args: unknown[]) => mockGetCountry(...args),
  getCountryCities: (...args: unknown[]) => mockGetCountryCities(...args),
  getCategories: (...args: unknown[]) => mockGetCategories(...args),
}));

vi.mock('@/services/events', () => ({
  getEvents: (...args: unknown[]) => mockGetEvents(...args),
}));

describe('CountryDetailPage', () => {
  afterEach(() => {
    vi.useRealTimers();
    focusManager.setFocused(undefined);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCountry.mockResolvedValue({
      code: 'PK',
      name: 'Pakistan',
      continent: 'Asia',
      profile: {
        capital: 'Islamabad',
        population: '240M',
        area: '881,913',
        shortDescription: 'Pakistan is a country in South Asia.',
      },
    });
    mockGetCountryCities.mockResolvedValue([
      { slug: 'pk-islamabad', name: 'Islamabad', countryCode: 'PK', image: '/images/islamabad.jpg', profile: { shortDescription: 'City description', population: '1 million' } },
      { slug: 'pk-karachi', name: 'Karachi', countryCode: 'PK' },
    ]);
    mockGetCategories.mockResolvedValue({ items: [] });
    mockGetEvents.mockResolvedValue([]);
  });

  it('renders the countries cities list for Pakistan', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/country/PK']}>
          <Routes>
            <Route path="/country/:code" element={<CountryDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const islamabadLink = await screen.findByRole('link', { name: 'Islamabad' });
    expect(islamabadLink).toHaveAttribute('href', '/city/pk-islamabad');
    expect(islamabadLink).toHaveTextContent(/^Islamabad$/);
    expect(within(islamabadLink).queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getAllByText('881,913 sq km')).toHaveLength(2);
    expect(screen.getAllByText('Karachi').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pakistan').length).toBeGreaterThan(0);
  });

  it('shows only linked names for cities and historical events on non-Pakistan country pages', async () => {
    mockGetCountry.mockResolvedValue({
      code: 'AR',
      name: 'Argentina',
      continent: 'South America',
      profile: { capital: 'Buenos Aires', shortDescription: 'Argentina profile.' },
    });
    mockGetCountryCities.mockResolvedValue([
      { slug: 'ar-buenos-aires', name: 'Buenos Aires', countryCode: 'AR', image: '/images/buenos-aires.webp', profile: { shortDescription: 'City description', population: '3 million' } },
    ]);
    mockGetEvents.mockResolvedValue([
      {
        id: 'argentina-history',
        slug: 'argentina-independence-day',
        title: 'Argentina Independence Day',
        description: 'Document date: 9 July\nHistorical/cultural significance: Independence.',
        startAt: '2026-07-09T00:00:00.000Z',
        endAt: '2026-07-09T23:59:59.999Z',
        countryCode: 'AR',
        city: 'Buenos Aires',
        category: 'National Holiday',
        image: '/images/independence-day.webp',
      },
    ]);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/country/AR']}>
          <Routes>
            <Route path="/country/:code" element={<CountryDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const cityLink = await screen.findByRole('link', { name: 'Buenos Aires' });
    expect(cityLink).toHaveAttribute('href', '/city/ar-buenos-aires');
    expect(cityLink).toHaveTextContent(/^Buenos Aires$/);
    expect(within(cityLink).queryByRole('img')).not.toBeInTheDocument();

    const eventLink = await screen.findByRole('link', { name: 'Argentina Independence Day' });
    expect(eventLink).toHaveAttribute('href', '/event/argentina-independence-day');
    expect(eventLink).toHaveTextContent(/^Argentina Independence Day$/);
    expect(within(eventLink).queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders the verified Azerbaijan city names in the country Big Cities section', async () => {
    const cities = [
      { slug: 'az-baku', name: 'Baku', displayName: 'Baku' },
      { slug: 'az-fuzuli', name: 'Fuzuli International Airport', displayName: 'Fuzuli' },
      { slug: 'az-gabala', name: 'Gabala International Airport', displayName: 'Gabala' },
      { slug: 'az-ganja', name: 'Ganja International Airport', displayName: 'Ganja' },
      { slug: 'az-lachin', name: 'Lachin International Airport', displayName: 'Lachin' },
      { slug: 'az-lankaran', name: 'Lankaran', displayName: 'Lankaran' },
      { slug: 'az-nakhchivan', name: 'Nakhchivan International Airport', displayName: 'Nakhchivan' },
      { slug: 'az-zangilan', name: 'Zangilan International Airport', displayName: 'Zangilan' },
      { slug: 'az-zaqatala', name: 'Zaqatala International Airport', displayName: 'Zaqatala' },
    ];
    mockGetCountry.mockResolvedValue({ code: 'AZ', name: 'Azerbaijan', continent: 'Asia', profile: { capital: 'Baku' } });
    mockGetCountryCities.mockResolvedValue(cities.map(({ slug, name }) => ({ slug, name, countryCode: 'AZ' })));
    mockGetEvents.mockResolvedValue([]);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/country/AZ']}>
          <Routes>
            <Route path="/country/:code" element={<CountryDetailPage />} />
            <Route path="/city/:slug" element={<h1>Existing city detail route</h1>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Big Cities in Azerbaijan' })).toBeInTheDocument();
    for (const city of cities) {
      const link = await screen.findByRole('link', { name: new RegExp(`^${city.displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) });
      expect(link).toHaveAttribute('href', `/city/${city.slug}`);
      if (city.name !== city.displayName) {
        expect(screen.queryByRole('link', { name: new RegExp(`^${city.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) })).not.toBeInTheDocument();
      }
    }
    expect(screen.getAllByRole('link').filter((link) => link.getAttribute('href')?.startsWith('/city/az-'))).toHaveLength(9);

    fireEvent.click(screen.getByRole('link', { name: /^Fuzuli$/ }));
    expect(await screen.findByRole('heading', { name: 'Existing city detail route' })).toBeInTheDocument();
  });

  it('renders the ticker below the live events section and selects the nearest upcoming event', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-09T12:00:00.000Z'));
    mockGetEvents.mockResolvedValue([
      {
        id: 'later',
        slug: 'later-event',
        title: 'Pakistan Day Parade',
        startAt: '2026-09-11T18:00:00.000Z',
        countryCode: 'PK',
      },
      {
        id: 'soon',
        slug: 'soon-event',
        title: 'Pakistan Independence Day',
        startAt: '2026-08-14T00:00:00.000Z',
        countryCode: 'PK',
      },
    ]);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/country/PK']}>
          <Routes>
            <Route path="/country/:code" element={<CountryDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const historicalEventsHeading = await screen.findByText('Historical events in Pakistan');
    const tickerTexts = await screen.findAllByText(/Upcoming Event:/i);
    expect(tickerTexts.length).toBeGreaterThan(0);
    expect(historicalEventsHeading.compareDocumentPosition(tickerTexts[0]) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(screen.getByRole('link', { name: /Pakistan Day Parade/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Only 2 days remaining!/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Celebrate the nation's independence/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Daily Events')).toBeInTheDocument();
    expect(screen.getAllByText(/Pakistan Independence Day/i).length).toBeGreaterThan(0);
  });

  it('automatically refetches the Pakistan daily-only query and shows all returned events without a full reload', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-09T12:00:00.000Z'));
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    focusManager.setFocused(true);
    let dailyFetchCount = 0;

    mockGetEvents.mockImplementation(async (params?: { country?: string; dailyOnly?: boolean }) => {
      if (params?.country === 'PK' && params?.dailyOnly === true) {
        dailyFetchCount += 1;
        if (dailyFetchCount === 1) {
          return [{ id: 'old-event', title: 'Old Daily Event', startAt: '2026-09-10T00:00:00.000Z', endAt: '2026-09-10T00:00:00.000Z', countryCode: 'PK' }];
        }
        return [
          { id: 'new-event-1', title: 'New Daily Event One', startAt: '2026-09-10T00:00:00.000Z', endAt: '2026-09-10T00:00:00.000Z', countryCode: 'PK' },
          { id: 'new-event-2', title: 'New Daily Event Two', startAt: '2026-09-11T00:00:00.000Z', endAt: '2026-09-11T00:00:00.000Z', countryCode: 'PK' },
        ];
      }
      return [];
    });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/country/PK']}>
          <Routes>
            <Route path="/country/:code" element={<CountryDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Old Daily Event')).toBeInTheDocument();
    expect(mockGetEvents).toHaveBeenCalledWith({ country: 'PK', perPage: 100, dailyOnly: true });

    await queryClient.refetchQueries({ queryKey: ['country-daily-events', 'PK'], type: 'active' });

    expect(await screen.findByText('New Daily Event One')).toBeInTheDocument();
    expect(screen.getByText('New Daily Event Two')).toBeInTheDocument();
    expect(screen.queryByText('Old Daily Event')).not.toBeInTheDocument();
  });

  it('uses the same upcoming event logic for a non-Pakistan country page and ignores events from other countries', async () => {
    mockGetCountry.mockResolvedValue({
      code: 'AR',
      name: 'Argentina',
      continent: 'South America',
      profile: {
        capital: 'Buenos Aires',
        population: '45M',
        shortDescription: 'Argentina is a country in South America.',
      },
    });
    mockGetCountryCities.mockResolvedValue([
      { slug: 'ar-buenos-aires', name: 'Buenos Aires', countryCode: 'AR' },
    ]);
    mockGetEvents.mockResolvedValue([
      {
        id: 'foreign',
        slug: 'foreign-event',
        title: 'Pakistan Day Parade',
        startAt: '2026-08-20T00:00:00.000Z',
        countryCode: 'PK',
      },
      {
        id: 'local-soon',
        slug: 'local-soon-event',
        title: 'Argentina Independence Day',
        startAt: '2026-07-09T00:00:00.000Z',
        countryCode: 'AR',
      },
      {
        id: 'local-later',
        slug: 'local-later-event',
        title: 'National Day of Memory',
        startAt: '2026-12-10T00:00:00.000Z',
        countryCode: 'AR',
      },
    ]);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/country/AR']}>
          <Routes>
            <Route path="/country/:code" element={<CountryDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const historicalEventsHeading = await screen.findByText('Historical events in Argentina');
    const tickerTexts = await screen.findAllByText(/Upcoming Event:/i);
    expect(tickerTexts.length).toBeGreaterThan(0);
    expect(historicalEventsHeading.compareDocumentPosition(tickerTexts[0]) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(screen.getAllByText(/Argentina Independence Day/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Pakistan Day Parade/i)).not.toBeInTheDocument();
  });
});
