import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from '../DashboardPage';

const mocks = vi.hoisted(() => ({
  getCategories: vi.fn(),
  getCountries: vi.fn(),
  getContinents: vi.fn(),
  getCountry: vi.fn(),
  getCountryCityDirectory: vi.fn(),
  getCity: vi.fn(),
  getEvent: vi.fn(),
  getEventsPage: vi.fn(),
  getDashboardOverview: vi.fn(),
  createCountry: vi.fn(),
  updateCountry: vi.fn(),
  updateCountryWithImages: vi.fn(),
  deleteCountry: vi.fn(),
  createCity: vi.fn(),
  updateCity: vi.fn(),
  deleteCity: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  upload: vi.fn(),
}));

vi.mock('@/services/catalog', () => ({
  getCategories: mocks.getCategories,
  getCountries: mocks.getCountries,
  getContinents: mocks.getContinents,
  getCountry: mocks.getCountry,
  getCountryCityDirectory: mocks.getCountryCityDirectory,
  getCity: mocks.getCity,
  createCountry: mocks.createCountry,
  updateCountry: mocks.updateCountry,
  updateCountryWithImages: mocks.updateCountryWithImages,
  deleteCountry: mocks.deleteCountry,
  createCity: mocks.createCity,
  updateCity: mocks.updateCity,
  deleteCity: mocks.deleteCity,
}));

vi.mock('@/services/events', () => ({
  getEvent: mocks.getEvent,
  getEventsPage: mocks.getEventsPage,
  createEvent: mocks.createEvent,
  updateEvent: mocks.updateEvent,
  deleteEvent: mocks.deleteEvent,
}));

vi.mock('@/services/dashboard', () => ({
  getDashboardOverview: mocks.getDashboardOverview,
}));

vi.mock('@/api/client', () => ({
  apiClient: { post: mocks.upload },
}));

function renderDashboard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>
    </HelmetProvider>,
  );
}

const page = <T,>(items: T[], total = items.length) => ({
  items,
  pagination: { page: 1, perPage: 12, total, totalPages: Math.max(1, Math.ceil(total / 12)) },
});

describe('DashboardPage data managers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCategories.mockResolvedValue(page([{ id: 'category-1', name: 'Culture', slug: 'culture' }]));
    mocks.getCountries.mockResolvedValue(page([{ code: 'AF', name: 'Afghanistan', profile: {}, cities: 1, events: 1 }]));
    mocks.getContinents.mockResolvedValue([{ id: 'continent-1', name: 'Asia' }]);
    mocks.getCountry.mockResolvedValue({ code: 'AF', name: 'Afghanistan', continent: 'Asia', profile: {}, cities: 1, events: 1 });
    mocks.getCountryCityDirectory.mockResolvedValue(page([{ slug: 'af-herat', name: 'Herat', countryCode: 'AF' }]));
    mocks.getCity.mockResolvedValue({ slug: 'af-herat', name: 'Herat', countryCode: 'AF', profile: {} });
    mocks.getEvent.mockResolvedValue(null);
    mocks.getEventsPage.mockResolvedValue(page([
      {
        id: 'event-1',
        slug: 'af-cultural-event',
        title: 'Afghanistan Cultural Event',
        description: 'A test fixture event.',
        countryCode: 'AF',
        citySlug: 'af-herat',
        categoryId: 'category-1',
        startAt: '2026-08-19T00:00:00.000Z',
        endAt: '2026-08-20T00:00:00.000Z',
        tags: [],
        enabled: true,
      },
    ]));
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
    mocks.updateCountry.mockResolvedValue({});
    mocks.updateCountryWithImages.mockResolvedValue({
      code: 'AF',
      name: 'Afghanistan',
      profile: {
        heroImageUrl: '/images/uploads/admin-user/1-hero.png',
        flagImageUrl: '/images/uploads/admin-user/2-flag.png',
      },
    });
    mocks.updateCity.mockResolvedValue({});
    mocks.updateEvent.mockResolvedValue({});
    mocks.createCountry.mockResolvedValue({ code: 'JP', name: 'Japan', profile: {} });
    mocks.createCity.mockResolvedValue({ slug: 'af-kabul', name: 'Kabul', countryCode: 'AF', profile: {} });
    mocks.createEvent.mockResolvedValue({ id: 'event-2', slug: 'af-new-event', title: 'New Event', countryCode: 'AF' });
    mocks.deleteCountry.mockResolvedValue(undefined);
    mocks.deleteCity.mockResolvedValue(undefined);
    mocks.deleteEvent.mockResolvedValue(undefined);
  });

  it('shows a visible error when saving a city fails', async () => {
    mocks.updateCity.mockRejectedValue({ status: 503, message: 'Database writes are disabled.' });
    renderDashboard();

    await screen.findByDisplayValue('Herat');
    fireEvent.click(screen.getByRole('button', { name: 'Save city' }));

    expect(await screen.findByText('Database writes are disabled.')).toBeInTheDocument();
  });

  it('shows a visible error when saving an event fails', async () => {
    mocks.updateEvent.mockRejectedValue({ status: 503, message: 'Database writes are disabled.' });
    renderDashboard();

    fireEvent.click(await screen.findByRole('button', { name: 'Afghanistan Cultural Event AF' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save event' }));

    expect(await screen.findByText('Database writes are disabled.')).toBeInTheDocument();
  });

  it('shows a visible error when a country image update fails', async () => {
    mocks.updateCountryWithImages.mockRejectedValue(new Error('Uploads are disabled in staging.'));
    renderDashboard();
    await screen.findByDisplayValue('Afghanistan');

    const heroUploadInput = screen.getByText('Upload new hero image').parentElement?.querySelector('input[type="file"]');
    if (!(heroUploadInput instanceof HTMLInputElement)) throw new Error('Country hero file input was not rendered.');
    fireEvent.change(heroUploadInput, {
      target: { files: [new File(['image'], 'audit.png', { type: 'image/png' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save country' }));
    expect(await screen.findByText('Uploads are disabled in staging.')).toBeInTheDocument();
  });

  it('saves an uploaded event image as a backend-relative object path', async () => {
    mocks.upload.mockResolvedValue({
      data: { success: true, data: [{ url: '/images/uploads/admin-user/audit-image.png' }] },
    });
    renderDashboard();
    fireEvent.click(await screen.findByRole('button', { name: 'Afghanistan Cultural Event AF' }));
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fireEvent.change(fileInputs[fileInputs.length - 1], {
      target: { files: [new File(['image'], 'audit-image.png', { type: 'image/png' })] },
    });
    await screen.findByText('Image uploaded. Save the record to apply it.');
    fireEvent.click(screen.getByRole('button', { name: 'Save event' }));

    await waitFor(() => expect(mocks.updateEvent).toHaveBeenCalledWith(
      'af-cultural-event',
      expect.objectContaining({ image: '/images/uploads/admin-user/audit-image.png' }),
    ));
  });

  it('saves selected country images together and verifies the persisted references before success', async () => {
    const persistedCountry = {
      code: 'AF',
      name: 'Afghanistan',
      continent: 'Asia',
      profile: {
        heroImageUrl: '/images/uploads/admin-user/1-hero.png',
        flagImageUrl: '/images/uploads/admin-user/2-flag.png',
      },
    };
    mocks.updateCountryWithImages.mockResolvedValue(persistedCountry);
    mocks.getCountry.mockResolvedValue(persistedCountry);
    const { container } = renderDashboard();
    await screen.findByDisplayValue('Afghanistan');
    const inputs = container.querySelectorAll('input[type="file"]');
    fireEvent.change(inputs[0], {
      target: { files: [new File(['hero'], 'hero.png', { type: 'image/png' })] },
    });
    fireEvent.change(inputs[1], {
      target: { files: [new File(['flag'], 'flag.png', { type: 'image/png' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save country' }));

    expect(await screen.findByText('Country updated successfully.')).toBeInTheDocument();
    expect(mocks.updateCountryWithImages).toHaveBeenCalledWith('AF', expect.objectContaining({
      heroImage: expect.any(File),
      flagImage: expect.any(File),
    }));
    expect(mocks.updateCountry).not.toHaveBeenCalled();
  });

  it('does not report a country save as successful when the image update fails', async () => {
    mocks.updateCountryWithImages.mockRejectedValue(new Error('Country images could not be saved.'));
    let resolveCities: () => void = () => {};
    mocks.getCountryCityDirectory.mockReturnValueOnce(new Promise((resolve) => {
      resolveCities = () => resolve(page([{ slug: 'af-herat', name: 'Herat', countryCode: 'AF' }]));
    }));
    const { container } = renderDashboard();
    await screen.findByDisplayValue('Afghanistan');
    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input as HTMLInputElement, {
      target: { files: [new File(['hero'], 'hero.png', { type: 'image/png' })] },
    });
    resolveCities();
    fireEvent.click(screen.getByRole('button', { name: 'Save country' }));

    await waitFor(() => expect(mocks.updateCountryWithImages).toHaveBeenCalled());
    expect(await screen.findByText('Country images could not be saved.')).toBeInTheDocument();
    expect(screen.queryByText('Country updated successfully.')).not.toBeInTheDocument();
  });

  it('creates a country through the API and reports success', async () => {
    renderDashboard();
    await screen.findByDisplayValue('Afghanistan');
    mocks.getCountry.mockResolvedValueOnce({ code: 'JP', name: 'Japan', continent: 'Asia', profile: {} });
    fireEvent.click(await screen.findByRole('button', { name: 'Create country' }));
    fireEvent.change(screen.getByLabelText('Country name'), { target: { value: 'Japan' } });
    const countryCodeInput = screen.getAllByLabelText('Country code').find((input) => !(input as HTMLInputElement).readOnly);
    expect(countryCodeInput).toBeDefined();
    fireEvent.change(countryCodeInput as HTMLInputElement, { target: { value: 'JP' } });
    fireEvent.change(screen.getByLabelText('Continent'), { target: { value: 'continent-1' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Create country' }).slice(-1)[0]);

    await waitFor(() => expect(mocks.createCountry).toHaveBeenCalledWith(expect.objectContaining({
      code: 'JP',
      name: 'Japan',
      continentId: 'continent-1',
    })));
    expect(await screen.findByText('Country created successfully.')).toBeInTheDocument();
  });

  it('creates a city under the selected country', async () => {
    renderDashboard();
    await screen.findByRole('button', { name: /Afghanistan/ });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Create city' })).toBeEnabled());
    fireEvent.click(await screen.findByRole('button', { name: 'Create city' }));
    fireEvent.change(screen.getByLabelText('City name'), { target: { value: 'Kabul' } });
    fireEvent.change(screen.getByLabelText('City slug'), { target: { value: 'af-kabul' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Create city' }).slice(-1)[0]);

    await waitFor(() => expect(mocks.createCity).toHaveBeenCalledWith('AF', expect.objectContaining({
      slug: 'af-kabul',
      name: 'Kabul',
      countryCode: 'AF',
    })));
    expect(await screen.findByText('City created successfully.')).toBeInTheDocument();
  });

  it('creates an event with valid dates and selected relationships', async () => {
    renderDashboard();
    mocks.getEvent.mockResolvedValue({
      id: 'event-2',
      slug: 'af-new-event',
      title: 'New Event',
      countryCode: 'AF',
      categoryId: 'category-1',
      startAt: '2027-01-01T10:00:00.000Z',
      endAt: '2027-01-01T11:00:00.000Z',
    });
    await screen.findByRole('button', { name: /Afghanistan/ });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Create event' })).toBeEnabled());
    fireEvent.click(await screen.findByRole('button', { name: 'Create event' }));
    fireEvent.change(screen.getByLabelText('Event title'), { target: { value: 'New Event' } });
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'category-1' } });
    fireEvent.change(screen.getByLabelText('City slug'), { target: { value: 'af-herat' } });
    fireEvent.change(screen.getByLabelText('Venue'), { target: { value: 'Community Hall' } });
    fireEvent.change(screen.getByLabelText('Source URL'), { target: { value: 'https://events.example.test/new-event' } });
    fireEvent.change(screen.getByLabelText('Start'), { target: { value: '2027-01-01T10:00' } });
    fireEvent.change(screen.getByLabelText('End'), { target: { value: '2027-01-01T11:00' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Create event' }).slice(-1)[0]);

    await waitFor(() => expect(mocks.createEvent).toHaveBeenCalledWith(expect.objectContaining({
      title: 'New Event',
      categoryId: 'category-1',
      countryCode: 'AF',
      citySlug: 'af-herat',
      venue: 'Community Hall',
      sourceUrl: 'https://events.example.test/new-event',
    })));
    expect(await screen.findByText('Event created successfully.')).toBeInTheDocument();
  });

  it('requires confirmation before deleting a city', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderDashboard();
    await screen.findByDisplayValue('Herat');
    fireEvent.click(screen.getByRole('button', { name: 'Delete city' }));

    expect(confirm).toHaveBeenCalled();
    expect(mocks.deleteCity).not.toHaveBeenCalled();
    confirm.mockRestore();
  });

  it('filters and sorts countries through the paginated API query', async () => {
    renderDashboard();
    await screen.findByRole('button', { name: /Afghanistan/ });
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter countries by continent' }), { target: { value: 'Asia' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Sort countries' }), { target: { value: 'name:desc' } });
    await waitFor(() => expect(mocks.getCountries).toHaveBeenLastCalledWith({
      q: undefined,
      continent: 'Asia',
      page: 1,
      perPage: 12,
      sort: 'name:desc',
    }));
  });

  it('sorts the selected country city directory through the API query', async () => {
    renderDashboard();
    await screen.findByRole('button', { name: /Afghanistan/ });
    fireEvent.change(screen.getByRole('combobox', { name: 'Sort cities' }), { target: { value: 'name:desc' } });

    await waitFor(() => expect(mocks.getCountryCityDirectory).toHaveBeenLastCalledWith('AF', {
      q: undefined,
      page: 1,
      perPage: 12,
      sort: 'name:desc',
    }));
  });

  it('filters and sorts events through the selected country API query', async () => {
    renderDashboard();
    await screen.findByRole('button', { name: /Afghanistan/ });
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter events by category' }), { target: { value: 'category-1' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter events by status' }), { target: { value: 'false' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Sort events' }), { target: { value: 'title:asc' } });

    await waitFor(() => expect(mocks.getEventsPage).toHaveBeenLastCalledWith({
      country: 'AF',
      q: undefined,
      category: 'category-1',
      enabled: false,
      sort: 'title:asc',
      includeDisabled: true,
      perPage: 12,
      page: 1,
    }));
  });
});
