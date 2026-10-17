import { describe, expect, it } from 'vitest';
import { syncPakistanEvents } from './sync-service';
import type { EventSource } from './types';

function createPrismaMock() {
  const stored: Array<Record<string, any>> = [];
  const prisma = {
    category: { upsert: async ({ create }: any) => ({ id: create.slug, ...create }) },
    city: { findMany: async () => [{ slug: 'pk-lahore', name: 'Lahore' }] },
    event: {
      findFirst: async ({ where }: any) => {
        const sourceIdentity = where.OR?.find((entry: any) => entry.externalEventId || entry.sourceUrl || entry.contentHash);
        return stored.find((entry) => (sourceIdentity?.externalEventId && entry.externalEventId === sourceIdentity.externalEventId) || (sourceIdentity?.sourceUrl && entry.sourceUrl === sourceIdentity.sourceUrl) || (sourceIdentity?.contentHash && entry.contentHash === sourceIdentity.contentHash)) ?? null;
      },
      create: async ({ data }: any) => { const event = { id: `event-${stored.length + 1}`, ...data }; stored.push(event); return event; },
      update: async ({ where, data }: any) => { const event = stored.find((entry) => entry.id === where.id); if (!event) throw new Error('Event not found'); Object.assign(event, data); return event; },
      updateMany: async () => ({ count: 0 }),
    },
  };
  return { prisma: prisma as any, stored };
}

const sourceEvent = {
  title: 'Pakistan Tech Summit',
  description: 'Technology conference',
  countryCode: 'PK' as const,
  sourceCity: 'Lahore',
  venue: 'Expo Center',
  startAt: new Date('2026-10-10T00:00:00.000Z'),
  endAt: new Date('2026-10-10T23:59:59.999Z'),
  image: null,
  sourceName: 'Test Source',
  sourceUrl: 'https://example.com/events/1',
  externalEventId: '1',
  categoryName: 'Tech Events' as const,
  tags: ['tech events', 'pakistan'],
};

const logger = { info: () => undefined, warn: () => undefined, error: () => undefined };

describe('Pakistan event sync', () => {
  it('updates the same source event instead of inserting a duplicate', async () => {
    const { prisma, stored } = createPrismaMock();
    const source: EventSource = { name: 'Test Source', url: sourceEvent.sourceUrl, collect: async () => [sourceEvent] };

    const first = await syncPakistanEvents(prisma, logger, [source]);
    const second = await syncPakistanEvents(prisma, logger, [source]);

    expect(first.inserted).toBe(1);
    expect(second.updated).toBe(1);
    expect(stored).toHaveLength(1);
  });

  it('continues when one source fails', async () => {
    const { prisma, stored } = createPrismaMock();
    const broken: EventSource = { name: 'Broken Source', url: 'https://example.com/broken', collect: async () => { throw new Error('timeout'); } };
    const working: EventSource = { name: 'Working Source', url: sourceEvent.sourceUrl, collect: async () => [sourceEvent] };

    const result = await syncPakistanEvents(prisma, logger, [broken, working]);

    expect(result.failedSources).toEqual([{ source: 'Broken Source', message: 'timeout' }]);
    expect(stored).toHaveLength(1);
  });
});