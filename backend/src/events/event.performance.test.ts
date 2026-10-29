import { describe, expect, it, vi } from 'vitest';
import EventService from './event.service';

describe('event list performance behavior', () => {
  it('skips the city lookup for exact-city lists and respects the requested page size', async () => {
    const event = {
      id: 'event-1',
      slug: 'lahore-event',
      title: 'Lahore Event',
      categoryId: null,
      citySlug: 'pk-lahore',
      countryCode: 'PK',
      startAt: new Date('2026-10-24T10:00:00.000Z'),
      endAt: new Date('2026-10-24T12:00:00.000Z'),
    };
    const eventCount = vi.fn().mockResolvedValue(24);
    const eventFindMany = vi.fn().mockResolvedValue([event]);
    const cityFindUnique = vi.fn();
    const prisma = {
      event: { count: eventCount, findMany: eventFindMany },
      city: {
        findUnique: cityFindUnique,
        findMany: vi.fn().mockResolvedValue([{ slug: 'pk-lahore', name: 'Lahore' }]),
      },
      category: { findMany: vi.fn().mockResolvedValue([]) },
    };
    const service = new EventService(prisma as any);

    const result = await service.list({
      countryCode: 'PK',
      citySlug: 'pk-lahore',
      exactCity: true,
      page: 1,
      perPage: 12,
    });

    expect(cityFindUnique).not.toHaveBeenCalled();
    expect(eventCount).toHaveBeenCalledWith({
      where: { enabled: true, countryCode: 'PK', citySlug: 'pk-lahore' },
    });
    expect(eventFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { enabled: true, countryCode: 'PK', citySlug: 'pk-lahore' },
      skip: 0,
      take: 12,
    }));
    expect(result.items).toHaveLength(1);
    expect(result.pagination).toEqual({ page: 1, perPage: 12, total: 24, totalPages: 2 });
  });
});
