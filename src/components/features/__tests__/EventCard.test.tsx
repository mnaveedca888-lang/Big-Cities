import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { EventCard } from '../EventCard';

const { getEvent } = vi.hoisted(() => ({ getEvent: vi.fn() }));

vi.mock('@/services/events', () => ({ getEvent }));

describe('EventCard', () => {
  it('prefetches event details when a card receives hover or keyboard focus', async () => {
    getEvent.mockResolvedValue({ slug: 'event-1', title: 'Test event' });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <EventCard event={{ id: 'event-1', slug: 'event-1', title: 'Test event', description: 'Description' }} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const link = screen.getByRole('link', { name: /test event/i });
    fireEvent.mouseEnter(link);
    fireEvent.focus(link);

    await waitFor(() => expect(getEvent).toHaveBeenCalledTimes(1));
    expect(getEvent).toHaveBeenCalledWith('event-1');
    expect(queryClient.getQueryData(['event', 'event-1'])).toEqual(expect.objectContaining({ slug: 'event-1' }));
  });
});
