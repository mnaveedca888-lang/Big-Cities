import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from '../DashboardPage';

const mocks = vi.hoisted(() => ({
  apiPost: vi.fn(),
  getDashboardOverview: vi.fn(),
  getCountries: vi.fn(),
  getCategories: vi.fn(),
  getCountryCities: vi.fn(),
  getEvents: vi.fn(),
  updateCountry: vi.fn(),
  updateCity: vi.fn(),
  updateEvent: vi.fn(),
  verifyImageReplacement: vi.fn(),
  deletePreviousImage: vi.fn(),
}));

vi.mock('@/api/client', () => ({
  apiClient: { post: mocks.apiPost },
}));

vi.mock('@/services/catalog', () => ({
  getCategories: mocks.getCategories,
  getCountries: mocks.getCountries,
  getCountryCities: mocks.getCountryCities,
  updateCountry: mocks.updateCountry,
  updateCity: mocks.updateCity,
}));

vi.mock('@/services/events', () => ({
  getEvents: mocks.getEvents,
  updateEvent: mocks.updateEvent,
}));

vi.mock('@/services/dashboard', () => ({
  getDashboardOverview: mocks.getDashboardOverview,
}));

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

async function uploadCountryHeroReplacement() {
  const fileInput = document.querySelectorAll<HTMLInputElement>('input[type="file"]')[0];
  fireEvent.change(fileInput, { target: { files: [new File(['image'], 'replacement.png', { type: 'image/png' })] } });
  await waitFor(() => expect(mocks.apiPost).toHaveBeenCalledWith(
    '/uploads/files',
    expect.any(FormData),
    expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'multipart/form-data' }) }),
  ));
  await screen.findByDisplayValue(newUrl);
}

describe('DashboardPage image replacement deletion affordance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.getDashboardOverview.mockResolvedValue({});
    mocks.getCountries.mockResolvedValue({
      items: [{ code: 'AL', name: 'Albania', image: oldUrl, profile: { heroImageUrl: oldUrl, flagImageUrl: '' } }],
    });
    mocks.getCategories.mockResolvedValue({ items: [] });
    mocks.getCountryCities.mockResolvedValue([{
      slug: 'city-al',
      name: 'Tirana',
      countryCode: 'AL',
      profile: { heroImageUrl: cityOldUrl },
    }]);
    mocks.getEvents.mockResolvedValue([{
      id: 'event-1',
      slug: 'event-al',
      title: 'Annual event',
      countryCode: 'AL',
      image: eventOldUrl,
      startAt: '2026-11-01T10:00:00.000Z',
      endAt: '2026-11-01T12:00:00.000Z',
    }]);
    mocks.updateCountry.mockResolvedValue({});
    mocks.updateCity.mockResolvedValue({});
    mocks.updateEvent.mockResolvedValue({});
    mocks.apiPost.mockResolvedValue({ data: { success: true, data: [{ url: newUrl }] } });
    mocks.verifyImageReplacement.mockResolvedValue({ verified: true, canDeletePrevious: true, reason: null });
    mocks.deletePreviousImage.mockResolvedValue({ deleted: true, alreadyDeleted: false });
  });

  it('shows the exact deletion option only after the record save and image verification succeed', async () => {
    renderDashboard();
    await screen.findAllByDisplayValue(oldUrl);
    await uploadCountryHeroReplacement();

    expect(screen.queryByRole('button', { name: 'Delete Previous Image Permanently' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save country' }));

    const deleteButton = await screen.findByRole('button', { name: 'Delete Previous Image Permanently' });
    expect(mocks.updateCountry).toHaveBeenCalled();
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

  it('does not show the deletion option after an upload failure', async () => {
    mocks.apiPost.mockRejectedValueOnce(new Error('upload failed'));
    renderDashboard();
    await screen.findAllByDisplayValue(oldUrl);
    const fileInput = document.querySelectorAll<HTMLInputElement>('input[type="file"]')[0];
    fireEvent.change(fileInput, { target: { files: [new File(['image'], 'replacement.png', { type: 'image/png' })] } });
    fireEvent.click(await screen.findByRole('button', { name: 'Save country' }));

    await waitFor(() => expect(mocks.updateCountry).toHaveBeenCalled());
    expect(mocks.verifyImageReplacement).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Delete Previous Image Permanently' })).not.toBeInTheDocument();
  });

  it('does not show the deletion option after the database update fails', async () => {
    mocks.updateCountry.mockRejectedValueOnce(new Error('database update failed'));
    renderDashboard();
    await screen.findAllByDisplayValue(oldUrl);
    await uploadCountryHeroReplacement();
    fireEvent.click(screen.getByRole('button', { name: 'Save country' }));

    await waitFor(() => expect(mocks.updateCountry).toHaveBeenCalled());
    expect(mocks.verifyImageReplacement).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Delete Previous Image Permanently' })).not.toBeInTheDocument();
  });

  it('does not show the deletion option when image verification fails', async () => {
    mocks.verifyImageReplacement.mockRejectedValueOnce(new Error('image could not be read'));
    renderDashboard();
    await screen.findAllByDisplayValue(oldUrl);
    await uploadCountryHeroReplacement();
    fireEvent.click(screen.getByRole('button', { name: 'Save country' }));

    expect(await screen.findByText(/replacement was saved, but its image could not be verified/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete Previous Image Permanently' })).not.toBeInTheDocument();
  });

  it('leaves the previous image untouched when the confirmation is canceled', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderDashboard();
    await screen.findAllByDisplayValue(oldUrl);
    await uploadCountryHeroReplacement();
    fireEvent.click(screen.getByRole('button', { name: 'Save country' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete Previous Image Permanently' }));

    expect(confirm).toHaveBeenCalledWith('Permanently delete the previous image? This action cannot be undone.');
    expect(mocks.deletePreviousImage).not.toHaveBeenCalled();
  });

  it('deletes only after confirmation and reports success', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderDashboard();
    await screen.findAllByDisplayValue(oldUrl);
    await uploadCountryHeroReplacement();
    fireEvent.click(screen.getByRole('button', { name: 'Save country' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete Previous Image Permanently' }));

    await waitFor(() => expect(mocks.deletePreviousImage).toHaveBeenCalledWith(expect.objectContaining({
      previousUrl: oldUrl,
      replacementUrl: newUrl,
      entity: 'country',
      entityId: 'AL',
    })));
    expect(await screen.findByText('Previous image permanently deleted.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete Previous Image Permanently' })).not.toBeInTheDocument();
  });

  it('wires the verified deletion flow to city image replacement', async () => {
    renderDashboard();
    await screen.findAllByDisplayValue(cityOldUrl);
    const fileInput = document.querySelectorAll<HTMLInputElement>('input[type="file"]')[2];
    fireEvent.change(fileInput, { target: { files: [new File(['image'], 'city.png', { type: 'image/png' })] } });
    await screen.findAllByDisplayValue(newUrl);
    fireEvent.click(screen.getByRole('button', { name: 'Save city' }));

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
    const fileInput = document.querySelectorAll<HTMLInputElement>('input[type="file"]')[3];
    fireEvent.change(fileInput, { target: { files: [new File(['image'], 'event.png', { type: 'image/png' })] } });
    await screen.findAllByDisplayValue(newUrl);
    fireEvent.click(screen.getByRole('button', { name: 'Save event' }));

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
