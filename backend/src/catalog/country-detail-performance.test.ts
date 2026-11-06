import Fastify from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import registerCatalogRoutes from './catalog.controller';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe('country detail query scheduling', () => {
  let app: ReturnType<typeof Fastify>;
  const countryResult = deferred<{
    code: string;
    name: string;
    profile: null;
    continent: { name: string };
  } | null>();
  const cityCountResult = deferred<number>();
  const eventCountResult = deferred<number>();
  const countryFindUnique = vi.fn(() => countryResult.promise);
  const cityCount = vi.fn(() => cityCountResult.promise);
  const eventCount = vi.fn(() => eventCountResult.promise);
  const prisma = new Proxy({}, {
    get: (_client, model) => {
      if (model === 'country') return { findUnique: countryFindUnique };
      if (model === 'city') return { count: cityCount };
      if (model === 'event') return { count: eventCount };
      return {};
    },
  }) as PrismaClient;

  beforeEach(() => {
    app = Fastify();
    registerCatalogRoutes(app, prisma);
    countryFindUnique.mockClear();
    cityCount.mockClear();
    eventCount.mockClear();
  });

  it('starts the country lookup and independent record counts concurrently', async () => {
    await app.ready();
    const responsePromise = app.inject({ method: 'GET', url: '/countries/pk' });
    await vi.waitFor(() => expect(countryFindUnique).toHaveBeenCalledTimes(1));

    expect(countryFindUnique).toHaveBeenCalledWith({
      where: { code: 'PK' },
      include: { continent: true },
    });
    expect(cityCount).toHaveBeenCalledWith({ where: { countryCode: 'PK' } });
    expect(eventCount).toHaveBeenCalledWith({ where: { countryCode: 'PK' } });

    countryResult.resolve({
      code: 'PK',
      name: 'Pakistan',
      profile: null,
      continent: { name: 'Asia' },
    });
    cityCountResult.resolve(9);
    eventCountResult.resolve(55);

    const response = await responsePromise;
    expect(response.statusCode).toBe(200);
    expect(response.json().data).toMatchObject({
      code: 'PK',
      name: 'Pakistan',
      continent: 'Asia',
      cities: 9,
      events: 55,
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
