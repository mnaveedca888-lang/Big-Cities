import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';

const discoverAndStoreEvents = vi.fn().mockResolvedValue({ stored: 1, events: [] });
const selectOldestCategory = vi.fn(async (_prisma: unknown, _country: string, excluded: string[] = []) => ['Technology', 'Concerts'].find((category) => !excluded.includes(category)) || null);
const syncPakistanEvents = vi.fn().mockResolvedValue({});

vi.mock('../discovery.service', () => ({
  discoverAndStoreEvents,
  selectOldestCategory,
}));

vi.mock('./sync-service', () => ({
  syncPakistanEvents,
}));

const logger = { info: () => undefined, warn: () => undefined, error: () => undefined };

async function getScheduler() {
  return (await import('./scheduler')).startEventSyncScheduler;
}

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();
  delete process.env.OPENAI_API_KEY;
  delete process.env.DATABASE_WRITES_ENABLED;
  delete process.env.EVENT_SYNC_ENABLED;
  delete process.env.EVENT_SYNC_INTERVAL_HOURS;
  delete process.env.EVENT_DISCOVERY_INTERVAL_MINUTES;
  delete process.env.EVENT_SYNC_RUN_ON_START;
  delete process.env.EVENT_DISCOVERY_ENABLED;
  delete process.env.EVENT_AI_DISCOVERY_COUNTRIES;
  const schedulerModule = await import('./scheduler');
  (globalThis as any).__schedulerModule = schedulerModule;
});

afterEach(() => {
  delete process.env.OPENAI_API_KEY;
  delete process.env.DATABASE_WRITES_ENABLED;
  delete process.env.EVENT_SYNC_ENABLED;
  delete process.env.EVENT_SYNC_INTERVAL_HOURS;
  delete process.env.EVENT_DISCOVERY_INTERVAL_MINUTES;
  delete process.env.EVENT_SYNC_RUN_ON_START;
  delete process.env.EVENT_DISCOVERY_ENABLED;
  delete process.env.EVENT_AI_DISCOVERY_COUNTRIES;
});

describe('event sync scheduler', () => {
  it('processes all supported categories when the configured budget permits', async () => {
    process.env.DATABASE_WRITES_ENABLED = 'true';
    process.env.EVENT_SYNC_ENABLED = 'true';
    process.env.EVENT_DISCOVERY_ENABLED = 'true';
    process.env.EVENT_SYNC_RUN_ON_START = 'true';
    process.env.EVENT_AI_DISCOVERY_COUNTRIES = 'PK';
    const categories = ['Sports Events', 'Concerts', 'Theatre Shows', 'Art Exhibitions', 'Educational Seminars', 'Film Festivals', 'Food Festivals', 'Fashion Shows', 'Tech Events', 'Dignitary Visits', 'Government Events'];
    let index = 0;
    selectOldestCategory.mockImplementation(async () => categories[index++] || null);
    const prisma = {
      country: { findMany: vi.fn().mockResolvedValue([{ code: 'PK', name: 'Pakistan' }]) },
      eventDiscoveryState: { findMany: vi.fn().mockResolvedValue([]) },
      event: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
    } as any;
    const freshStart = await getScheduler();
    const stop = freshStart(prisma, logger);
    await vi.waitFor(() => expect(discoverAndStoreEvents).toHaveBeenCalledTimes(11));
    expect(discoverAndStoreEvents.mock.calls.map((call) => call[2])).toEqual(categories);
    stop?.();
    selectOldestCategory.mockImplementation(async (_prisma: unknown, _country: string, excluded: string[] = []) => ['Technology', 'Concerts'].find((category) => !excluded.includes(category)) || null);
  });

  it('stays disabled when explicitly disabled', async () => {
    process.env.DATABASE_WRITES_ENABLED = 'true';
    process.env.EVENT_SYNC_ENABLED = 'false';
    const startEventSyncScheduler = await getScheduler();
    expect(startEventSyncScheduler({} as any, logger)).toBeNull();
  });

  it('stays disabled unless database writes are explicitly enabled', async () => {
    process.env.EVENT_SYNC_ENABLED = 'true';
    const startEventSyncScheduler = await getScheduler();
    expect(startEventSyncScheduler({} as any, logger)).toBeNull();
  });

  it('uses the discovery interval in minutes without running on startup when disabled', async () => {
    process.env.DATABASE_WRITES_ENABLED = 'true';
    process.env.EVENT_SYNC_ENABLED = 'true';
    process.env.EVENT_SYNC_RUN_ON_START = 'false';
    process.env.EVENT_DISCOVERY_INTERVAL_MINUTES = '60';
    const startEventSyncScheduler = await getScheduler();
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    const stop = startEventSyncScheduler({} as any, logger);
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60 * 60 * 1000);
    stop?.();
    setIntervalSpy.mockRestore();
  });

  it('prevents duplicate in-process schedulers and can be stopped', async () => {
    process.env.DATABASE_WRITES_ENABLED = 'true';
    process.env.EVENT_SYNC_ENABLED = 'true';
    process.env.EVENT_SYNC_INTERVAL_HOURS = 'not-a-number';
    process.env.EVENT_SYNC_RUN_ON_START = 'false';
    const startEventSyncScheduler = await getScheduler();
    const stop = startEventSyncScheduler({} as any, logger);
    expect(stop).toEqual(expect.any(Function));
    expect(startEventSyncScheduler({} as any, logger)).toBeNull();
    stop?.();
    const restarted = startEventSyncScheduler({} as any, logger);
    expect(restarted).toEqual(expect.any(Function));
    restarted?.();
  });

  it('runs automatic web discovery without requiring an OpenAI key', async () => {
    process.env.DATABASE_WRITES_ENABLED = 'true';
    process.env.EVENT_SYNC_ENABLED = 'true';
    process.env.EVENT_DISCOVERY_ENABLED = 'true';
    process.env.EVENT_SYNC_RUN_ON_START = 'true';
    process.env.EVENT_AI_DISCOVERY_COUNTRIES = 'PK';

    const prisma = {
      country: {
        findMany: vi.fn().mockResolvedValue([{ code: 'PK', name: 'Pakistan' }]),
      },
      eventDiscoveryState: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      event: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    } as any;

    const freshStart = await getScheduler();
    const stop = freshStart(prisma, logger);
    await vi.waitFor(() => {
      expect(discoverAndStoreEvents).toHaveBeenCalledWith(prisma, { code: 'PK', name: 'Pakistan' }, expect.any(String), { maxQueries: 1 });
    });
    stop?.();
  });

  it('does not run automatic discovery unless explicitly enabled', async () => {
    process.env.DATABASE_WRITES_ENABLED = 'true';
    process.env.EVENT_SYNC_ENABLED = 'true';
    process.env.EVENT_SYNC_RUN_ON_START = 'true';
    const prisma = {
      event: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
    } as any;

    const startEventSyncScheduler = await getScheduler();
    const stop = startEventSyncScheduler(prisma, logger);
    await vi.waitFor(() => expect(syncPakistanEvents).toHaveBeenCalled());

    expect(discoverAndStoreEvents).not.toHaveBeenCalled();
    stop?.();
  });
});