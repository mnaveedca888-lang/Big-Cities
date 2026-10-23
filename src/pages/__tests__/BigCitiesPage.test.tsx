import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import BigCitiesPage from '../BigCitiesPage';

const mockGetCityDirectory = vi.fn();

vi.mock('@/services/catalog', () => ({
  getCityDirectory: (...args: unknown[]) => mockGetCityDirectory(...args),
}));

const mangshi = { slug: 'cn-mangshi-dehong', name: 'Mangshi International Airport' };

function directoryResponse(items: typeof mangshi[], page: number, total: number) {
  return {
    items,
    pagination: { page, perPage: 12, total, totalPages: Math.ceil(total / 12) },
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/cities']}>
        <Routes>
          <Route path="/cities" element={<BigCitiesPage />} />
          <Route path="/city/:slug" element={<h1>Existing city detail route</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('BigCitiesPage', () => {
  it('uses server pagination and searches display-name aliases and exclusions after a debounce', async () => {
    const firstPage = [
      'Lahore', 'Islamabad', 'Karachi', 'Peshawar', 'Quetta', 'Multan',
      'Faisalabad', 'Sialkot', 'Rawalpindi', 'Gujranwala', 'Hyderabad', 'Abbottabad',
    ].map((name, index) => ({ slug: `city-${index}`, name }));

    mockGetCityDirectory.mockImplementation(async ({ q, page }: { q?: string; page?: number }) => {
      if (q === 'Dehong') return directoryResponse([mangshi], 1, 1);
      if (q === 'Quatro') return directoryResponse([], 1, 0);
      return page === 2 ? directoryResponse([mangshi], 2, 13) : directoryResponse(firstPage, 1, 13);
    });
    renderPage();

    expect(await screen.findByText('13 cities')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(mockGetCityDirectory).toHaveBeenCalledWith(expect.objectContaining({ page: 1, perPage: 12 }));

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    const secondPageLink = await screen.findByRole('link', { name: 'Mangshi (Dehong) International Airport' });
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(secondPageLink).toHaveAttribute('href', '/city/cn-mangshi-dehong');

    const search = screen.getByRole('textbox', { name: 'Search cities' });
    fireEvent.change(search, { target: { value: 'Dehong' } });
    await waitFor(() => {
      expect(mockGetCityDirectory).toHaveBeenCalledWith(expect.objectContaining({
        q: 'Dehong',
        page: 1,
        aliasSlugs: ['cn-mangshi-dehong'],
        excludeSlugs: [],
      }));
    }, { timeout: 3000 });
    const aliasLink = await screen.findByRole('link', { name: 'Mangshi (Dehong) International Airport' }, { timeout: 3000 });
    fireEvent.click(aliasLink);
    expect(await screen.findByRole('heading', { name: 'Existing city detail route' })).toBeInTheDocument();
  });

  it('excludes raw airport names when they do not match the displayed city name', async () => {
    mockGetCityDirectory.mockImplementation(async ({ q }: { q?: string }) => (
      q === 'Quatro'
        ? directoryResponse([], 1, 0)
        : directoryResponse([{ slug: 'pk-lahore', name: 'Lahore' }], 1, 1)
    ));
    renderPage();

    fireEvent.change(screen.getByRole('textbox', { name: 'Search cities' }), { target: { value: 'Quatro' } });
    expect(await screen.findByText('No cities found')).toBeInTheDocument();
    await waitFor(() => {
      expect(mockGetCityDirectory).toHaveBeenCalledWith(expect.objectContaining({
        q: 'Quatro',
        aliasSlugs: [],
        excludeSlugs: ['ao-quatro-de-fevereiro-international-airport-lad-luanda'],
      }));
    }, { timeout: 3000 });
  });
});
