import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CountriesPage from '../CountriesPage';

const { getContinents, getCountryDirectory } = vi.hoisted(() => ({
  getContinents: vi.fn(),
  getCountryDirectory: vi.fn(),
}));

vi.mock('@/services/catalog', () => ({ getContinents, getCountryDirectory }));
vi.mock('@/services/routePrefetch', () => ({ prefetchCountryPage: vi.fn() }));

describe('CountriesPage', () => {
  beforeEach(() => {
    getContinents.mockResolvedValue([{ id: 'asia', name: 'Asia' }]);
    getCountryDirectory.mockResolvedValue({
      items: [{ code: 'PK', name: 'Pakistan', continent: 'Asia', events: 17 }],
      pagination: { page: 1, perPage: 12, total: 1, totalPages: 1 },
    });
  });

  it('uses the lightweight directory while preserving country event counts', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/countries']}>
          <Routes>
            <Route path="/countries" element={<CountriesPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Pakistan' })).toBeInTheDocument();
    expect(screen.getByText('17 events')).toBeInTheDocument();
    expect(getCountryDirectory).toHaveBeenCalledWith({
      page: 1,
      perPage: 12,
      q: undefined,
      continent: undefined,
    });
  });
});
