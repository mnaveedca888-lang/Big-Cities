import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CountriesPage from '../CountriesPage';

const getCountryDirectory = vi.fn();
const getContinents = vi.fn();

vi.mock('@/services/catalog', () => ({
  getCountryDirectory: (...args: unknown[]) => getCountryDirectory(...args),
  getContinents: (...args: unknown[]) => getContinents(...args),
}));

const countryRecords = Array.from({ length: 13 }, (_, index) => ({
  code: `C${index + 1}`,
  name: index === 0 ? 'Japan' : `Country ${index + 1}`,
  continent: index === 0 ? 'Asia' : 'Europe',
  events: index,
}));

function renderCountriesPage() {
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
}

describe('CountriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getContinents.mockResolvedValue([{ id: 'asia', name: 'Asia' }, { id: 'europe', name: 'Europe' }]);
    getCountryDirectory.mockImplementation(async ({ q, continent, page = 1, perPage = 12 }: {
      q?: string;
      continent?: string;
      page?: number;
      perPage?: number;
    }) => {
      const filtered = countryRecords.filter((country) =>
        (!q || country.name.toLowerCase().includes(q.toLowerCase()))
        && (!continent || country.continent === continent));
      const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
      return {
        items: filtered.slice((page - 1) * perPage, page * perPage),
        pagination: { page, perPage, total: filtered.length, totalPages },
      };
    });
  });

  it('uses the directory endpoint for paginated countries, search, and continent filtering', async () => {
    renderCountriesPage();

    expect(await screen.findByText('Page 1 of 2')).toBeInTheDocument();
    expect(getCountryDirectory).toHaveBeenLastCalledWith({
      q: undefined,
      continent: undefined,
      page: 1,
      perPage: 12,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByRole('link', { name: /Country 13/ })).toHaveAttribute('href', '/country/C13');

    fireEvent.change(screen.getByPlaceholderText('Search countries'), { target: { value: 'Japan' } });
    await waitFor(() => {
      expect(getCountryDirectory).toHaveBeenLastCalledWith({
        q: 'Japan',
        continent: undefined,
        page: 1,
        perPage: 12,
      });
    });
    expect(await screen.findByRole('link', { name: /Japan/ })).toHaveAttribute('href', '/country/C1');

    fireEvent.change(screen.getByLabelText('Filter countries by continent'), { target: { value: 'Asia' } });
    await waitFor(() => {
      expect(getCountryDirectory).toHaveBeenLastCalledWith({
        q: 'Japan',
        continent: 'Asia',
        page: 1,
        perPage: 12,
      });
    });
    expect(screen.getByRole('link', { name: /Japan/ })).toBeInTheDocument();
  });
});
