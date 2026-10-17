import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ContinentsPage from '../ContinentsPage';
import CountriesPage from '../CountriesPage';

const mockGetContinents = vi.fn();
const mockGetCountries = vi.fn();

vi.mock('@/services/catalog', () => ({
  getContinents: (...args: unknown[]) => mockGetContinents(...args),
  getCountries: (...args: unknown[]) => mockGetCountries(...args),
}));

describe('ContinentsPage', () => {
  it('filters continent names case-insensitively and opens the existing country filter flow', async () => {
    mockGetContinents.mockResolvedValue([
      { id: 'asia', name: 'Asia', countries: 49 },
      { id: 'europe', name: 'Europe', countries: 43 },
    ]);
    mockGetCountries.mockResolvedValue({ items: [], pagination: { page: 1, perPage: 12, total: 0, totalPages: 0 } });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/continents']}>
          <Routes>
            <Route path="/continents" element={<ContinentsPage />} />
            <Route path="/countries" element={<CountriesPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('link', { name: /Europe.*43 countries/ })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'Search continents' }), { target: { value: 'aS' } });
    const asiaLink = await screen.findByRole('link', { name: /Asia.*49 countries/ });
    expect(screen.queryByRole('link', { name: /Europe.*43 countries/ })).not.toBeInTheDocument();
    fireEvent.click(asiaLink);

    expect(await screen.findByRole('heading', { name: 'Discover Countries & Their Cities' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Filter countries by continent' })).toHaveValue('Asia');
    expect(mockGetCountries).toHaveBeenCalledWith(expect.objectContaining({ continent: 'Asia' }));
  });
});