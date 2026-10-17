import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import BigCitiesPage from '../BigCitiesPage';

const mockGetCities = vi.fn();

vi.mock('@/services/catalog', () => ({
  getCities: (...args: unknown[]) => mockGetCities(...args),
}));

describe('BigCitiesPage', () => {
  it('searches cities case-insensitively, paginates results, and opens the existing detail route', async () => {
    const cityNames = ['Lahore', 'Islamabad', 'Karachi', 'Peshawar', 'Quetta', 'Multan', 'Faisalabad', 'Sialkot', 'Rawalpindi', 'Gujranwala', 'Hyderabad', 'Abbottabad', 'Mangshi (Dehong)'];
    mockGetCities.mockResolvedValue([...cityNames.map((name, index) => ({
      slug: index === 0 ? 'pk-lahore' : index === cityNames.length - 1 ? 'cn-mangshi-dehong' : `city-${index}`,
      name,
      countryCode: index === cityNames.length - 1 ? 'CN' : 'PK',
      image: index === 0 ? '/images/Pakistan%20cities%20images/Lahore.png' : null,
      population: index === 0 ? '11,000,000' : null,
      shortDescription: index === 0 ? 'Lahore description must not appear.' : null,
      profile: index === 0 ? { heroImageUrl: '/images/lahore.webp', shortDescription: 'Profile description must not appear.' } : null,
    })),
    { slug: 'cn-changchun', name: 'Changchun Longjia International Airport', countryCode: 'CN' },
    { slug: 'kr-yangyang', name: 'Yangyang International Airport', countryCode: 'KR' },
    ]);
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

    expect(screen.getByRole('heading', { name: 'Big Cities' })).toBeInTheDocument();
    expect(await screen.findByText('Page 1 of 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByRole('link', { name: /Mangshi \(Dehong\)/ })).toHaveAttribute('href', '/city/cn-mangshi-dehong');
    fireEvent.change(screen.getByRole('textbox', { name: 'Search cities' }), { target: { value: 'lAh' } });

    const lahoreLink = await screen.findByRole('link', { name: /Lahore/ });
    expect(lahoreLink).toHaveAttribute('href', '/city/pk-lahore');
  expect(lahoreLink).toHaveTextContent(/^Lahore$/);
    expect(screen.queryByRole('link', { name: /Islamabad/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(screen.queryByText('PK')).not.toBeInTheDocument();
  expect(screen.queryByText('Population: 11,000,000')).not.toBeInTheDocument();
  expect(screen.queryByText('Lahore description must not appear.')).not.toBeInTheDocument();
  expect(screen.queryByText('Profile description must not appear.')).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Search cities' }), { target: { value: 'Changchun International Airport' } });
    const changchunLink = await screen.findByRole('link', { name: 'Changchun International Airport' });
    expect(changchunLink).toHaveAttribute('href', '/city/cn-changchun');

    fireEvent.change(screen.getByRole('textbox', { name: 'Search cities' }), { target: { value: 'Yangyang International Airport' } });
    const reviewLink = await screen.findByRole('link', { name: 'Yangyang International Airport' });
    expect(reviewLink).toHaveAttribute('href', '/city/kr-yangyang');

    fireEvent.change(screen.getByRole('textbox', { name: 'Search cities' }), { target: { value: 'lAh' } });
    const updatedLahoreLink = await screen.findByRole('link', { name: /Lahore/ });

    fireEvent.click(updatedLahoreLink);
    expect(await screen.findByRole('heading', { name: 'Existing city detail route' })).toBeInTheDocument();
  });

  it('shows verified Azerbaijan city names without changing slugs or Baku and Lankaran labels', async () => {
    const cityRecords = [
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
    mockGetCities.mockResolvedValue(cityRecords.map(({ slug, name }) => ({ slug, name, countryCode: 'AZ' })));
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

    for (const city of cityRecords) {
      const link = await screen.findByRole('link', { name: city.displayName });
      expect(link).toHaveAttribute('href', `/city/${city.slug}`);
      if (city.name !== city.displayName) {
        expect(screen.queryByRole('link', { name: city.name, exact: true })).not.toBeInTheDocument();
      }
    }
    expect(await screen.findAllByRole('link')).toHaveLength(9);

    fireEvent.click(screen.getByRole('link', { name: 'Fuzuli' }));
    expect(await screen.findByRole('heading', { name: 'Existing city detail route' })).toBeInTheDocument();
  });
});