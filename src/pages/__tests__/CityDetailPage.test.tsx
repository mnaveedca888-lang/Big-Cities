import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CityDetailPage from '../CityDetailPage';

const mockGetCity = vi.fn();
const mockGetEvents = vi.fn();

function exactAccessibleName(value: string) {
  return new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
}

vi.mock('@/services/catalog', () => ({
  getCity: (...args: unknown[]) => mockGetCity(...args),
}));

vi.mock('@/services/events', () => ({
  getEvents: (...args: unknown[]) => mockGetEvents(...args),
}));

describe('CityDetailPage', () => {
  it.each([
    { slug: 'az-baku', apiName: 'Baku', displayName: 'Baku' },
    { slug: 'az-fuzuli', apiName: 'Fuzuli International Airport', displayName: 'Fuzuli' },
    { slug: 'az-gabala', apiName: 'Gabala International Airport', displayName: 'Gabala' },
    { slug: 'az-ganja', apiName: 'Ganja International Airport', displayName: 'Ganja' },
    { slug: 'az-lachin', apiName: 'Lachin International Airport', displayName: 'Lachin' },
    { slug: 'az-lankaran', apiName: 'Lankaran', displayName: 'Lankaran' },
    { slug: 'az-nakhchivan', apiName: 'Nakhchivan International Airport', displayName: 'Nakhchivan' },
    { slug: 'az-zangilan', apiName: 'Zangilan International Airport', displayName: 'Zangilan' },
    { slug: 'az-zaqatala', apiName: 'Zaqatala International Airport', displayName: 'Zaqatala' },
  ])('uses the Azerbaijan display name for $slug', async (city) => {
    mockGetCity.mockResolvedValue({ slug: city.slug, name: city.apiName, countryCode: 'AZ', profile: {} });
    mockGetEvents.mockResolvedValue([]);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/city/${city.slug}`]}>
          <Routes>
            <Route path="/city/:slug" element={<CityDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: exactAccessibleName(city.displayName) })).toBeInTheDocument();
    expect(document.title).toBe(`${city.displayName} details | Big Cities Event Monitor`);
    if (city.apiName !== city.displayName) {
      expect(screen.queryByRole('heading', { name: exactAccessibleName(city.apiName) })).not.toBeInTheDocument();
    }
  });

  it('renders canonical city sections and non-Pakistan city values', async () => {
    mockGetCity.mockResolvedValue({
      slug: 'ar-buenos-aires',
      name: 'Buenos Aires',
      countryCode: 'AR',
      profile: {
        shortDescription: 'A city-specific Argentina profile.',
        area: '881,913',
        overview: 'Buenos Aires overview',
        history: 'Buenos Aires history',
        climate: 'Humid subtropical',
        traditionalFood: 'Empanadas',
        metro: 'Buenos Aires Underground',
      },
    });
    mockGetEvents.mockResolvedValue([]);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/city/ar-buenos-aires']}>
          <Routes>
            <Route path="/city/:slug" element={<CityDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Buenos Aires' })).toBeInTheDocument();
    expect(screen.getAllByText('881,913 sq km')).toHaveLength(2);
    expect(screen.getByText('Buenos Aires overview')).toBeInTheDocument();
    expect(screen.getByText('Buenos Aires history')).toBeInTheDocument();
    expect(screen.getByText('Humid subtropical')).toBeInTheDocument();
    expect(screen.getByText('Empanadas')).toBeInTheDocument();
    expect(screen.getByText('Buenos Aires Underground')).toBeInTheDocument();
  });
});
