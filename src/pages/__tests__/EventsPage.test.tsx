import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import EventsPage from '../EventsPage';

const getEvents = vi.fn();
const getCountryDirectory = vi.fn();

vi.mock('@/services/events', () => ({
  getEvents: (...args: unknown[]) => getEvents(...args),
}));

vi.mock('@/services/catalog', () => ({
  filterHiddenCategories: (items: unknown[]) => items,
  getCountryDirectory: (...args: unknown[]) => getCountryDirectory(...args),
  isCategoryHiddenByUi: () => false,
}));

vi.mock('@/components/features/EventCard', () => ({
  EventCard: ({ event }: { event: { title: string } }) => <div>{event.title}</div>,
}));

describe('EventsPage', () => {
  it('loads country filters from the directory and filters events by the selected country', async () => {
    getEvents.mockResolvedValue([
      { id: 'event-us', title: 'US event', country: 'United States', countryCode: 'US', city: 'New York', category: 'Music' },
      { id: 'event-jp', title: 'Japan event', country: 'Japan', countryCode: 'JP', city: 'Tokyo', category: 'Festival' },
    ]);
    getCountryDirectory.mockResolvedValue({
      items: [
        { code: 'US', name: 'United States', continent: 'North America', events: 1 },
        { code: 'JP', name: 'Japan', continent: 'Asia', events: 1 },
      ],
      pagination: { page: 1, perPage: 300, total: 2, totalPages: 1 },
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <EventsPage />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('US event')).toBeInTheDocument();
    const searchInput = screen.getByPlaceholderText('Search events, cities, organizers');
    fireEvent.change(searchInput, { target: { value: 'event' } });
    expect(getEvents).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(getEvents).toHaveBeenLastCalledWith({
        q: 'event',
        category: undefined,
        country: undefined,
        city: undefined,
        perPage: 100,
      });
    });
    const callsAfterDebounce = getEvents.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(getEvents).toHaveBeenCalledTimes(callsAfterDebounce);

    fireEvent.click(screen.getByRole('button', { name: /Filters/ }));
    await waitFor(() => expect(getCountryDirectory).toHaveBeenCalledWith({ perPage: 300 }));

    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'JP' } });
    expect(await screen.findByText('Japan event')).toBeInTheDocument();
    expect(screen.queryByText('US event')).not.toBeInTheDocument();
  });
});
