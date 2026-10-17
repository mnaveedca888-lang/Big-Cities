import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/api/client';
import { getEvents, normalizeEventsPayload } from '@/services/events';

vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('events service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests backend events filtered by city slug', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        success: true,
        data: {
          items: [],
          pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 },
        },
      },
    } as never);

    await getEvents({ city: 'lahore' });

    expect(apiClient.get).toHaveBeenCalledWith('/events', expect.objectContaining({
      params: { city: 'lahore' },
    }));
  });

  it('passes search, category, country, and city filters to the backend', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        success: true,
        data: {
          items: [],
          pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 },
        },
      },
    } as never);

    await getEvents({ q: 'lahore', category: 'history', country: 'PK', city: 'lahore' });

    expect(apiClient.get).toHaveBeenCalledWith('/events', expect.objectContaining({
      params: { q: 'lahore', category: 'history', country: 'PK', city: 'lahore' },
    }));
  });
});

describe('normalizeEventsPayload', () => {
  it('unwraps the paginated API payload returned by the backend', () => {
    const payload = {
      success: true,
      data: {
        items: [
          {
            id: 'event-1',
            slug: 'sample-event',
            title: 'Sample event',
            description: 'A sample event',
            category: 'Technology',
            country: 'Pakistan',
            city: 'Lahore',
            date: '2026-08-10',
            time: '09:00',
            price: '$0',
            image: 'https://example.com/event.jpg',
            organizer: 'Example',
            venue: 'Example Hall',
            language: 'English',
            tags: ['AI'],
            attendees: 100,
          },
        ],
        pagination: {
          page: 1,
          perPage: 20,
          total: 1,
          totalPages: 1,
        },
      },
    };

    expect(normalizeEventsPayload(payload as any)).toHaveLength(1);
    expect(normalizeEventsPayload(payload as any)[0]?.slug).toBe('sample-event');
  });

  it('returns an empty array when the payload is empty', () => {
    expect(normalizeEventsPayload(undefined)).toEqual([]);
  });
});
