import { act, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SearchPage from '../SearchPage';

const { mockSearchEvents } = vi.hoisted(() => ({ mockSearchEvents: vi.fn() }));

vi.mock('@/services/search', () => ({
  searchEvents: (...args: unknown[]) => mockSearchEvents(...args),
}));

describe('SearchPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSearchEvents.mockResolvedValue({
      query: 'Lahore',
      events: [],
      countries: [],
      cities: [],
      categories: [],
      hasMore: { events: false, countries: false, cities: false, categories: false },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    mockSearchEvents.mockReset();
  });

  it('waits for typing to pause before sending one search request', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/search']}>
          <SearchPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Search events' }), { target: { value: 'Lahore' } });
    expect(mockSearchEvents).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(mockSearchEvents).toHaveBeenCalledTimes(1);
    expect(mockSearchEvents).toHaveBeenCalledWith(
      { query: 'Lahore', page: 1, pageSize: 12, category: undefined },
      expect.any(AbortSignal),
    );
  });
});
