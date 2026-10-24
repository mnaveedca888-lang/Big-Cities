import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from '../DashboardPage';

const mocks = vi.hoisted(() => ({
  getCategories: vi.fn(),
  getCountries: vi.fn(),
  getCountryCities: vi.fn(),
  getEvents: vi.fn(),
  getDashboardOverview: vi.fn(),
  updateCity: vi.fn(),
  updateEvent: vi.fn(),
  upload: vi.fn(),
}));

vi.mock('@/services/catalog', () => ({
  getCategories: mocks.getCategories,
  getCountries: mocks.getCountries,
  getCountryCities: mocks.getCountryCities,
  updateCountry: vi.fn(),
  updateCity: mocks.updateCity,
}));

vi.mock('@/services/events', () => ({
  getEvents: mocks.getEvents,
  updateEvent: mocks.updateEvent,
}));

vi.mock('@/services/dashboard', () => ({
  getDashboardOverview: mocks.getDashboardOverview,
}));

vi.mock('@/api/client', () => ({
  apiClient: { post: mocks.upload },
}));

function renderDashboard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>
    </HelmetProvider>,
  );
}

describe('DashboardPage save feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCategories.mockResolvedValue({
      items: [{ id: 'category-1', name: 'Culture', slug: 'culture' }],
      pagination: { page: 1, perPage: 200, total: 1, totalPages: 1 },
    });
    mocks.getCountries.mockResolvedValue({
      items: [{ code: 'AF', name: 'Afghanistan', profile: {} }],
      pagination: { page: 1, perPage: 500, total: 1, totalPages: 1 },
    });
    mocks.getCountryCities.mockResolvedValue([
      { slug: 'af-herat', name: 'Herat', countryCode: 'AF', profile: {} },
    ]);
    mocks.getEvents.mockResolvedValue([
      {
        id: 'event-1',
        slug: 'af-cultural-event',
        title: 'Afghanistan Cultural Event',
        description: 'A test fixture event.',
        countryCode: 'AF',
        citySlug: 'af-herat',
        startAt: '2026-08-19T00:00:00.000Z',
        endAt: '2026-08-20T00:00:00.000Z',
        tags: [],
        enabled: true,
      },
    ]);
    mocks.getDashboardOverview.mockResolvedValue({
      totalUsers: 1,
      totalEvents: 1,
      upcomingEvents: 1,
      savedEvents: 0,
      notifications: 0,
      watchlist: 0,
      recentEvents: [],
      recentActivity: [],
    });
  });

  it('shows a visible error when saving a city fails', async () => {
    mocks.updateCity.mockRejectedValue({ status: 503, message: 'Database writes are disabled.' });
    renderDashboard();

    await screen.findByDisplayValue('Herat');
    fireEvent.click(screen.getByRole('button', { name: 'Save city' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Database writes are disabled.');
  });

  it('shows a visible error when saving an event fails', async () => {
    mocks.updateEvent.mockRejectedValue({ status: 503, message: 'Database writes are disabled.' });
    renderDashboard();

    fireEvent.click(await screen.findByRole('button', { name: 'Afghanistan Cultural Event AF' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save event' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Database writes are disabled.');
  });

  it('shows a visible error when an image upload fails', async () => {
    mocks.upload.mockRejectedValue({ status: 503, message: 'Uploads are disabled in staging.' });
    const { container } = renderDashboard();
    await screen.findByDisplayValue('Afghanistan');

    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();
    fireEvent.change(fileInput as HTMLInputElement, {
      target: { files: [new File(['image'], 'audit.png', { type: 'image/png' })] },
    });

    expect(await screen.findByRole('status')).toHaveTextContent('Uploads are disabled in staging.');
  });
});
