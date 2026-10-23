import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomePage from '../HomePage';

const {
  mockApiGet,
  mockGetCategories,
  mockGetContinents,
  mockGetCountryCities,
  mockGetCountryDirectory,
  mockGetEvents,
  mockGetFeaturedEvents,
  mockGetVerifiedCityCount,
} = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
  mockGetCategories: vi.fn(),
  mockGetContinents: vi.fn(),
  mockGetCountryCities: vi.fn(),
  mockGetCountryDirectory: vi.fn(),
  mockGetEvents: vi.fn(),
  mockGetFeaturedEvents: vi.fn(),
  mockGetVerifiedCityCount: vi.fn(),
}));

vi.mock('@/api/client', () => ({ apiClient: { get: mockApiGet } }));
vi.mock('@/services/catalog', () => ({
  getCategories: mockGetCategories,
  getContinents: mockGetContinents,
  getCountryCities: mockGetCountryCities,
  getCountryDirectory: mockGetCountryDirectory,
  getVerifiedCityCount: mockGetVerifiedCityCount,
}));
vi.mock('@/services/events', () => ({
  getEvents: mockGetEvents,
  getFeaturedEvents: mockGetFeaturedEvents,
}));

describe('HomePage', () => {
  beforeEach(() => {
    mockApiGet.mockResolvedValue({ data: { data: { pagination: { total: 10 } } } });
    mockGetCategories.mockResolvedValue({ items: [], pagination: { total: 5 } });
    mockGetContinents.mockResolvedValue([]);
    mockGetCountryCities.mockResolvedValue([]);
    mockGetCountryDirectory.mockResolvedValue({ items: [], pagination: { total: 0 } });
    mockGetEvents.mockResolvedValue([]);
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
});
