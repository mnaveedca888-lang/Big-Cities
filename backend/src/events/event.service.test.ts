import type { PrismaClient } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { EventService } from './event.service';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe('EventService.list', () => {
  it('starts the count and page queries concurrently and preserves the mapped response', async () => {
    const countResult = deferred<number>();
    const eventResult = deferred<Array<{
      id: string;
      slug: string;
      title: string;
      categoryId: string;
      citySlug: string;
      image: null;
    }>>();
    const eventCount = vi.fn(() => countResult.promise);
    const eventFindMany = vi.fn(() => eventResult.promise);
    const cityFindMany = vi.fn(async () => [{ slug: 'pk-lahore', name: 'Lahore' }]);
    const categoryFindMany = vi.fn(async () => [{ id: 'category-1', name: 'Culture' }]);
    const prisma = {
      event: { count: eventCount, findMany: eventFindMany },
      city: { findMany: cityFindMany },
      category: { findMany: categoryFindMany },
    } as unknown as PrismaClient;

    const resultPromise = new EventService(prisma).list({ page: 2, perPage: 1 });

    expect(eventCount).toHaveBeenCalledOnce();
    expect(eventFindMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 1, take: 1 }));

    countResult.resolve(11);
    eventResult.resolve([{
      id: 'event-1',
      slug: 'lahore-cultural-event',
      title: 'Lahore Cultural Event',
      categoryId: 'category-1',
      citySlug: 'pk-lahore',
      image: null,
    }]);

    const result = await resultPromise;
    expect(result.items).toMatchObject([{ title: 'Lahore Cultural Event', category: 'Culture', city: 'Lahore' }]);
    expect(result.pagination).toEqual({ page: 2, perPage: 1, total: 11, totalPages: 11 });
  });
});
