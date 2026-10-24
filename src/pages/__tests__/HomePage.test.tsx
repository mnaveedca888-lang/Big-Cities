import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomePage from '../HomePage';

const {
  mockApiGet,
  mockGetCategories,
  mockGetContinents,
  mockGetCountryCityDirectory,
  mockGetCountryDirectory,
  mockGetEventsPage,
  mockGetFeaturedEvents,
  mockGetVerifiedCityCount,
} = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
  mockGetCategories: vi.fn(),
  mockGetContinents: vi.fn(),
  mockGetCountryCityDirectory: vi.fn(),
  mockGetCountryDirectory: vi.fn(),
  mockGetEventsPage: vi.fn(),
  mockGetFeaturedEvents: vi.fn(),
  mockGetVerifiedCityCount: vi.fn(),
}));

vi.mock('@/api/client', () => ({ apiClient: { get: mockApiGet } }));
vi.mock('@/services/catalog', () => ({
  getCategories: mockGetCategories,
  getContinents: mockGetContinents,
  getCountryCityDirectory: mockGetCountryCityDirectory,
  getCountryDirectory: mockGetCountryDirectory,
  getVerifiedCityCount: mockGetVerifiedCityCount,
}));
vi.mock('@/services/events', () => ({
  getEventsPage: mockGetEventsPage,
  getFeaturedEvents: mockGetFeaturedEvents,
}));

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiGet.mockResolvedValue({ data: { data: { pagination: { total: 10 } } } });
    mockGetCategories.mockResolvedValue({ items: [], pagination: { total: 5 } });
    mockGetContinents.mockResolvedValue([]);
    mockGetCountryCityDirectory.mockResolvedValue({
      items: [],
      pagination: { page: 1, perPage: 100, total: 0, totalPages: 0 },
    });
    mockGetCountryDirectory.mockResolvedValue({ items: [], pagination: { total: 0 } });
    mockGetEventsPage.mockResolvedValue({
      items: [],
      pagination: { page: 1, perPage: 12, total: 0, totalPages: 0 },
    });
    mockGetFeaturedEvents.mockResolvedValue([]);
    mockGetVerifiedCityCount.mockResolvedValue(0);
  });

  it('fetches one category when only the category total is needed', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(mockGetCategories).toHaveBeenCalledWith({ page: 1, perPage: 1 }));
  });

  it('loads lightweight, scoped results through the continent-to-event cascade', async () => {
    const user = userEvent.setup();
    mockGetContinents.mockResolvedValue([{ id: 'asia', name: 'Asia' }]);
    mockGetCountryDirectory.mockResolvedValue({
      items: [{ code: 'PK', name: 'Pakistan', continent: 'Asia', events: 0 }],
      pagination: { page: 1, perPage: 500, total: 1, totalPages: 1 },
    });
    mockGetCountryCityDirectory.mockResolvedValue({
      items: [
        { slug: 'pk-lahore', name: 'Lahore' },
        { slug: 'pk-karachi', name: 'Karachi' },
      ],
      pagination: { page: 1, perPage: 100, total: 2, totalPages: 1 },
    });
    mockGetEventsPage.mockResolvedValue({
      items: [{
        id: 'event-1',
        slug: 'lahore-event',
        title: 'Lahore Opening',
        description: '',
        city: 'Lahore',
        citySlug: 'pk-lahore',
      }],
      pagination: { page: 1, perPage: 12, total: 1, totalPages: 1 },
    });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await screen.findByRole('option', { name: 'Asia' });
    await user.selectOptions(screen.getByRole('combobox', { name: 'Continent' }), 'Asia');
    await screen.findByRole('link', { name: 'Pakistan' });
    expect(mockGetCountryDirectory).toHaveBeenCalledWith({
      continent: 'Asia',
      perPage: 500,
      includeEventCounts: false,
    });

    await user.selectOptions(screen.getByRole('combobox', { name: 'Country' }), 'PK');
    await screen.findByRole('link', { name: 'Lahore' });
    expect(mockGetCountryCityDirectory).toHaveBeenCalledWith('PK', { page: 1, perPage: 100 });

    await user.selectOptions(screen.getByRole('combobox', { name: 'City' }), 'pk-lahore');
    expect(await screen.findByText('Lahore Opening')).toBeInTheDocument();
    expect(mockGetEventsPage).toHaveBeenCalledWith({
      country: 'PK',
      city: 'pk-lahore',
      exactCity: true,
      perPage: 12,
      page: 1,
    });

    await user.selectOptions(screen.getByRole('combobox', { name: 'City' }), '');
    await user.selectOptions(screen.getByRole('combobox', { name: 'City' }), 'pk-lahore');
    expect(mockGetEventsPage).toHaveBeenCalledTimes(1);
  });

  it('loads further city and event pages and reuses cached selections', async () => {
    const user = userEvent.setup();
    mockGetContinents.mockResolvedValue([{ id: 'asia', name: 'Asia' }]);
    mockGetCountryDirectory.mockResolvedValue({
      items: [{ code: 'PK', name: 'Pakistan', continent: 'Asia' }],
      pagination: { page: 1, perPage: 500, total: 1, totalPages: 1 },
    });
    mockGetCountryCityDirectory.mockImplementation(async (_code: string, params: { page?: number }) => ({
      items: params.page === 1
        ? [{ slug: 'pk-lahore', name: 'Lahore' }]
        : [{ slug: 'pk-karachi', name: 'Karachi' }],
      pagination: {
        page: params.page ?? 1,
        perPage: 100,
        total: 101,
        totalPages: 2,
      },
    }));
    mockGetEventsPage.mockImplementation(async (params: { page?: number }) => ({
      items: params.page === 1
        ? Array.from({ length: 12 }, (_, index) => ({
            id: `event-${index + 1}`,
            slug: `lahore-event-${index + 1}`,
            title: `Lahore event ${index + 1}`,
            description: '',
            city: 'Lahore',
            citySlug: 'pk-lahore',
          }))
        : [{
            id: 'event-13',
            slug: 'lahore-event-13',
            title: 'More Lahore events',
            description: '',
            city: 'Lahore',
            citySlug: 'pk-lahore',
          }],
      pagination: {
        page: params.page ?? 1,
        perPage: 12,
        total: 13,
        totalPages: 2,
      },
    }));

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await screen.findByRole('option', { name: 'Asia' });
    await user.selectOptions(screen.getByRole('combobox', { name: 'Continent' }), 'Asia');
    await screen.findByRole('link', { name: 'Pakistan' });
    await user.selectOptions(screen.getByRole('combobox', { name: 'Country' }), 'PK');
    await screen.findByRole('link', { name: 'Lahore' });
    await user.click(screen.getByRole('button', { name: 'Load more cities' }));
    await screen.findByRole('link', { name: 'Karachi' });
    expect(mockGetCountryCityDirectory).toHaveBeenCalledTimes(2);

    await user.selectOptions(screen.getByRole('combobox', { name: 'City' }), 'pk-lahore');
    await screen.findByText('Lahore event 1');
    expect(screen.getByText('13 events found in Lahore')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Load more events' }));
    await screen.findByText('More Lahore events');
    expect(mockGetEventsPage).toHaveBeenCalledTimes(2);

    await user.selectOptions(screen.getByRole('combobox', { name: 'City' }), '');
    await user.selectOptions(screen.getByRole('combobox', { name: 'City' }), 'pk-lahore');
    expect(mockGetEventsPage).toHaveBeenCalledTimes(2);
  });
});
