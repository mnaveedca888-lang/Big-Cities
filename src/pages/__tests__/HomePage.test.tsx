import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomePage from '../HomePage';

const apiGet = vi.fn();
const getCategories = vi.fn();
const getContinents = vi.fn();
const getCountryDirectory = vi.fn();
const getCountryCities = vi.fn();
const getVerifiedCityCount = vi.fn();
const getEvents = vi.fn();
const getFeaturedEvents = vi.fn();

vi.mock('@/api/client', () => ({
  apiClient: { get: (...args: unknown[]) => apiGet(...args) },
}));

vi.mock('@/services/catalog', () => ({
  getCategories: (...args: unknown[]) => getCategories(...args),
  getContinents: (...args: unknown[]) => getContinents(...args),
  getCountryDirectory: (...args: unknown[]) => getCountryDirectory(...args),
  getCountryCities: (...args: unknown[]) => getCountryCities(...args),
  getVerifiedCityCount: (...args: unknown[]) => getVerifiedCityCount(...args),
}));

vi.mock('@/services/events', () => ({
  getEvents: (...args: unknown[]) => getEvents(...args),
  getFeaturedEvents: (...args: unknown[]) => getFeaturedEvents(...args),
}));

describe('HomePage statistics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockResolvedValue({ data: { data: { pagination: { total: 9 } } } });
    getCategories.mockResolvedValue({ items: [], pagination: { total: 7 } });
    getContinents.mockResolvedValue([]);
    getCountryDirectory.mockResolvedValue({
      items: [],
      pagination: { page: 1, perPage: 1, total: 42, totalPages: 42 },
    });
    getCountryCities.mockResolvedValue([]);
    getVerifiedCityCount.mockResolvedValue(123);
    getEvents.mockResolvedValue([]);
    getFeaturedEvents.mockResolvedValue([]);
  });

  it('uses the directory total and lightweight verified city count', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('123')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(getVerifiedCityCount).toHaveBeenCalledOnce();
    expect(getCountryDirectory).toHaveBeenCalledWith({
      page: 1,
      perPage: 1,
      includeEventCounts: false,
    });
  });
});
