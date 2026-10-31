import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from '../DashboardPage';

const mocks = vi.hoisted(() => ({
  apiPost: vi.fn(),
  getDashboardOverview: vi.fn(),
  getCountries: vi.fn(),
  getCountry: vi.fn(),
  getContinents: vi.fn(),
  getCategories: vi.fn(),
  getCountryCityDirectory: vi.fn(),
  getCity: vi.fn(),
  getEventsPage: vi.fn(),
  getEvent: vi.fn(),
  updateCountry: vi.fn(),
  updateCountryWithImages: vi.fn(),
  updateCity: vi.fn(),
  updateEvent: vi.fn(),
  verifyImageReplacement: vi.fn(),
  deletePreviousImage: vi.fn(),
}));

vi.mock('@/api/client', () => ({ apiClient: { post: mocks.apiPost } }));

vi.mock('@/services/catalog', () => ({
  createCity: vi.fn(),
  createCountry: vi.fn(),
  deleteCity: vi.fn(),
  deleteCountry: vi.fn(),
  getCategories: mocks.getCategories,
  getCity: mocks.getCity,
  getContinents: mocks.getContinents,
  getCountry: mocks.getCountry,
  getCountries: mocks.getCountries,
  getCountryCityDirectory: mocks.getCountryCityDirectory,
  updateCountry: mocks.updateCountry,
  updateCountryWithImages: mocks.updateCountryWithImages,
  updateCity: mocks.updateCity,
}));

vi.mock('@/services/events', () => ({
  createEvent: vi.fn(),
  deleteEvent: vi.fn(),
  getEvent: mocks.getEvent,
  getEventsPage: mocks.getEventsPage,
  updateEvent: mocks.updateEvent,
}));

vi.mock('@/services/dashboard', () => ({ getDashboardOverview: mocks.getDashboardOverview }));

vi.mock('@/services/imageReplacements', () => ({
  deletePreviousImage: mocks.deletePreviousImage,
  getImageUrlForDisplay: (url: string) => `https://backend.example${url}`,
  verifyImageReplacement: mocks.verifyImageReplacement,
}));

const oldUrl = '/images/uploads/admin-user/uploads/1000-old.png';
const newUrl = '/images/uploads/admin-user/uploads/2000-new.png';
const cityOldUrl = '/images/uploads/admin-user/uploads/1000-city.png';
const eventOldUrl = '/images/uploads/admin-user/uploads/1000-event.png';

function renderDashboard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardPage />
    </QueryClientProvider>,
  );
}

async function selectCountryImage() {
  const heroInput = document.querySelectorAll<HTMLInputElement>('input[type="file"]')[0];
  fireEvent.change(heroInput, { target: { files: [new File(['image'], 'replacement.png', { type: 'image/png' })] } });
  await screen.findByText(/Selected: replacement\.png/);
}

async function saveCountryReplacement() {
  await selectCountryImage();
  fireEvent.click(screen.getByRole('button', { name: 'Save country' }));
}

describe('DashboardPage image replacement deletion affordance', () => {
  let savedCountry: Record<string, unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    savedCountry = {
      code: 'AL',
      name: 'Albania',
      image: oldUrl,
      profile: { heroImageUrl: oldUrl, flagImageUrl: '' },
    };
    mocks.getDashboardOverview.mockResolvedValue({});
    mocks.getCountries.mockImplementation(async () => ({ items: [savedCountry], pagination: { total: 1, totalPages: 1 } }));
    mocks.getCountry.mockImplementation(async () => savedCountry);
    mocks.getContinents.mockResolvedValue([]);
    mocks.getCategories.mockResolvedValue({ items: [] });
    mocks.getCountryCityDirectory.mockResolvedValue({
      items: [{ slug: 'city-al', name: 'Tirana', countryCode: 'AL', profile: { heroImageUrl: cityOldUrl } }],
      pagination: { total: 1, totalPages: 1 },
    });
    mocks.getCity.mockResolvedValue({ slug: 'city-al', name: 'Tirana', countryCode: 'AL', profile: { heroImageUrl: cityOldUrl } });
    mocks.getEventsPage.mockResolvedValue({
      items: [{
        id: 'event-1',
        slug: 'event-al',
        title: 'Annual event',
        countryCode: 'AL',
        image: eventOldUrl,
        startAt: '2026-11-01T10:00:00.000Z',
        endAt: '2026-11-01T12:00:00.000Z',
      }],
      pagination: { total: 1, totalPages: 1 },
    });
    mocks.getEvent.mockResolvedValue({
      id: 'event-1',
      slug: 'event-al',
      title: 'Annual event',
      countryCode: 'AL',
      image: eventOldUrl,
      startAt: '2026-11-01T10:00:00.000Z',
      endAt: '2026-11-01T12:00:00.000Z',
    });
    mocks.updateCountry.mockResolvedValue(savedCountry);
    mocks.updateCountryWithImages.mockImplementation(async (_code, payload) => {
      savedCountry = {
        ...savedCountry,
        profile: { ...payload.profile, heroImageUrl: newUrl },
        image: newUrl,
      };
      return savedCountry;
    });
    mocks.updateCity.mockResolvedValue({});
    mocks.updateEvent.mockResolvedValue({});
    mocks.apiPost.mockResolvedValue({ data: { success: true, data: [{ url: newUrl }] } });
    mocks.verifyImageReplacement.mockResolvedValue({ verified: true, canDeletePrevious: true, reason: null });
    mocks.deletePreviousImage.mockResolvedValue({ deleted: true, alreadyDeleted: false });
  });

  it('shows the deletion option only after the country save and image verification succeed', async () => {
    renderDashboard();
    await screen.findAllByDisplayValue(oldUrl);
    await saveCountryReplacement();

    const deleteButton = await screen.findByRole('button', { name: 'Delete Previous Image Permanently' });
    expect(mocks.updateCountryWithImages).toHaveBeenCalled();
    expect(mocks.verifyImageReplacement).toHaveBeenCalledWith({
      entity: 'country',
      entityId: 'AL',
      field: 'heroImageUrl',
      previousUrl: oldUrl,
      replacementUrl: newUrl,
    });
    expect(screen.getByRole('img', { name: 'Verified replacement image' })).toHaveAttribute('src', `https://backend.example${newUrl}`);
    expect(deleteButton).toBeInTheDocument();
  });

  it('does not show the deletion option when the combined country upload/save fails', async () => {
    mocks.updateCountryWithImages.mockRejectedValueOnce(new Error('upload failed'));
    renderDashboard();
    await screen.findAllByDisplayValue(oldUrl);
    await selectCountryImage();
    fireEvent.click(screen.getByRole('button', { name: 'Save country' }));

    await screen.findByText('upload failed');
    expect(mocks.verifyImageReplacement).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Delete Previous Image Permanently' })).not.toBeInTheDocument();
  });

  it('does not show the deletion option when the database update fails', async () => {
    mocks.updateCountryWithImages.mockRejectedValueOnce(new Error('database update failed'));
    renderDashboard();
    await screen.findAllByDisplayValue(oldUrl);
    await selectCountryImage();
    fireEvent.click(screen.getByRole('button', { name: 'Save country' }));

    await screen.findByText(/database update failed/);
    expect(mocks.verifyImageReplacement).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Delete Previous Image Permanently' })).not.toBeInTheDocument();
  });

  it('does not show the deletion option when image verification fails', async () => {
    mocks.verifyImageReplacement.mockRejectedValueOnce(new Error('image could not be read'));
    renderDashboard();
    await screen.findAllByDisplayValue(oldUrl);
    await saveCountryReplacement();

    expect(await screen.findByText(/replacement was saved, but its image could not be verified/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete Previous Image Permanently' })).not.toBeInTheDocument();
  });

  it('leaves the previous image untouched when confirmation is canceled', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderDashboard();
    await screen.findAllByDisplayValue(oldUrl);
    await saveCountryReplacement();
    fireEvent.click(await screen.findByRole('button', { name: 'Delete Previous Image Permanently' }));

    expect(confirm).toHaveBeenCalledWith('Permanently delete the previous image? This action cannot be undone.');
    expect(mocks.deletePreviousImage).not.toHaveBeenCalled();
  });

  it('deletes only after confirmation and reports success', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderDashboard();
    await screen.findAllByDisplayValue(oldUrl);
    await saveCountryReplacement();
    fireEvent.click(await screen.findByRole('button', { name: 'Delete Previous Image Permanently' }));

    await waitFor(() => expect(mocks.deletePreviousImage).toHaveBeenCalledWith(expect.objectContaining({
      previousUrl: oldUrl,
      replacementUrl: newUrl,
      entity: 'country',
      entityId: 'AL',
    })));
    expect(await screen.findByText('Previous image permanently deleted.')).toBeInTheDocument();
  });

  it('wires the verified deletion flow to city image replacement', async () => {
    renderDashboard();
    await screen.findByRole('button', { name: /Tirana/ });
    fireEvent.click(screen.getByRole('button', { name: /Tirana/ }));
    await screen.findAllByDisplayValue(cityOldUrl);
    const cityInput = document.querySelectorAll<HTMLInputElement>('input[type="file"]')[2];
    fireEvent.change(cityInput, { target: { files: [new File(['image'], 'city.png', { type: 'image/png' })] } });
    await screen.findAllByDisplayValue(newUrl);
    fireEvent.click(screen.getByRole('button', { name: 'Save city' }));

    await waitFor(() => expect(mocks.updateCity).toHaveBeenCalled(), {
      onTimeout: (error) => new Error(`${error.message}\nStatus messages: ${screen.getAllByRole('status').map((item) => item.textContent).join(' | ')}`),
    });
    await waitFor(() => expect(mocks.verifyImageReplacement).toHaveBeenCalled());
    await screen.findByRole('button', { name: 'Delete Previous Image Permanently' });
    expect(mocks.verifyImageReplacement).toHaveBeenCalledWith(expect.objectContaining({
      entity: 'city',
      entityId: 'city-al',
      field: 'heroImageUrl',
      previousUrl: cityOldUrl,
      replacementUrl: newUrl,
    }));
  });

  it('wires the verified deletion flow to event image replacement', async () => {
    renderDashboard();
    fireEvent.click(await screen.findByRole('button', { name: /Annual event/ }));
    await screen.findAllByDisplayValue(eventOldUrl);
    const eventInput = document.querySelectorAll<HTMLInputElement>('input[type="file"]')[3];
    fireEvent.change(eventInput, { target: { files: [new File(['image'], 'event.png', { type: 'image/png' })] } });
    await screen.findAllByDisplayValue(newUrl);
    fireEvent.click(screen.getByRole('button', { name: 'Save event' }));

    await waitFor(() => expect(mocks.updateEvent).toHaveBeenCalled());
    await screen.findByRole('button', { name: 'Delete Previous Image Permanently' });
    expect(mocks.verifyImageReplacement).toHaveBeenCalledWith(expect.objectContaining({
      entity: 'event',
      entityId: 'event-al',
      field: 'image',
      previousUrl: eventOldUrl,
      replacementUrl: newUrl,
    }));
  });
});
