import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AboutPage from '../AboutPage';

const mockGetCountryDirectory = vi.fn();
const mockGetCity = vi.fn();
const mockGetVerifiedCityCount = vi.fn();
const mockGetEvents = vi.fn();

vi.mock('@/services/catalog', () => ({
  getCountryDirectory: (...args: unknown[]) => mockGetCountryDirectory(...args),
  getCity: (...args: unknown[]) => mockGetCity(...args),
  getVerifiedCityCount: (...args: unknown[]) => mockGetVerifiedCityCount(...args),
}));

vi.mock('@/services/events', () => ({
  getEvents: (...args: unknown[]) => mockGetEvents(...args),
}));

describe('AboutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCountryDirectory.mockResolvedValue({
      items: [
        { code: 'JP', name: 'Japan', continent: 'Asia' },
        { code: 'IT', name: 'Italy', continent: 'Europe' },
        { code: 'BR', name: 'Brazil', continent: 'South America' },
      ],
      pagination: { page: 1, perPage: 500, total: 195, totalPages: 1 },
    });
    mockGetCity.mockImplementation(async (slug: string) => ({
      slug,
      name: slug.split('-')[1],
      countryCode: 'PK',
    }));
    mockGetVerifiedCityCount.mockResolvedValue(42);
    mockGetEvents.mockResolvedValue([{ id: 'event-1', slug: 'japan-event', title: 'Japan catalog event', countryCode: 'JP', description: 'Historical/cultural significance: A catalog record.' }]);
  });

  it('shows live catalog counts and links to existing country, city, and event routes', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter><AboutPage /></MemoryRouter>
        </QueryClientProvider>
      </HelmetProvider>,
    );

    expect(await screen.findByText('195')).toBeInTheDocument();
    expect(await screen.findByText('42')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /japan/i })).toHaveAttribute('href', '/country/JP');
    expect(screen.getByRole('link', { name: /italy/i })).toHaveAttribute('href', '/country/IT');
    expect(screen.getByRole('link', { name: /brazil/i })).toHaveAttribute('href', '/country/BR');
    const cityExamples = screen.getByRole('heading', { name: 'Cities in the listed catalog' }).parentElement;
    expect(within(cityExamples as HTMLElement).getByRole('link', { name: /lahore/i })).toHaveAttribute('href', '/city/pk-lahore');
    expect(screen.getByRole('link', { name: 'View a catalog event' })).toHaveAttribute('href', '/event/japan-event');
    expect(mockGetCountryDirectory).toHaveBeenCalledWith({ page: 1, perPage: 500 });
    expect(mockGetCity).toHaveBeenCalledTimes(3);
    expect(mockGetCity).toHaveBeenNthCalledWith(1, 'pk-lahore');
    expect(mockGetCity).toHaveBeenNthCalledWith(2, 'pk-karachi');
    expect(mockGetCity).toHaveBeenNthCalledWith(3, 'pk-faisalabad');
    expect(mockGetVerifiedCityCount).toHaveBeenCalledOnce();
    expect(mockGetEvents).toHaveBeenCalledWith({ country: 'JP', perPage: 100 });
  });
});
