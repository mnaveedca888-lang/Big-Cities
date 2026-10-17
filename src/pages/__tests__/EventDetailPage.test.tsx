import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EventDetailPage from '../EventDetailPage';

const mockGetEvent = vi.fn();

vi.mock('@/services/events', () => ({
  getEvent: (...args: unknown[]) => mockGetEvent(...args),
}));

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/event/pakistan-history-journey']}>
        <Routes>
          <Route path="/event/:slug" element={<EventDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EventDetailPage', () => {
  beforeEach(() => {
    mockGetEvent.mockReset();
  });

  it('renders the requested event from the backend', async () => {
    mockGetEvent.mockResolvedValue({
      slug: 'pakistan-history-journey',
      title: 'Pakistan History Journey',
      description: 'Document date: 23 March\n\nHistorical/cultural significance: National observance commemorating the Lahore Resolution and the country’s historical identity.',
      startAt: '2026-02-01T09:00:00.000Z',
      endAt: '2026-02-01T17:00:00.000Z',
      countryCode: 'PK',
      citySlug: 'pk-karachi',
      category: 'History',
      tags: 'history,karachi',
      featured: false,
    });

    renderPage();

    expect(await screen.findByText('Pakistan History Journey')).toBeInTheDocument();
    expect(screen.getByText(/Historical date:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/23 March/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Historical significance:/i)).toBeInTheDocument();
    expect(screen.getByText('Pakistan')).toBeInTheDocument();
    expect(screen.queryByText(/Starts:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Ends:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Time:/i)).not.toBeInTheDocument();
  });
});
