import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import registerCatalogRoutes from './catalog.controller';

describe('catalog directory read endpoints', () => {
  let app: ReturnType<typeof Fastify>;
  const cityFindMany = vi.fn().mockResolvedValue([
    { slug: 'pk-lahore', name: 'Lahore' },
  ]);
  const cityCount = vi.fn().mockResolvedValue(42);
  const cityGroupBy = vi.fn().mockResolvedValue([]);
  const countryFindMany = vi.fn().mockResolvedValue([
    {
      code: 'JP',
      name: 'Japan',
      continent: { name: 'Asia' },
      _count: { events: 17 },
      profile: { mustNotReturn: true },
    },
  ]);
  const countryCount = vi.fn().mockResolvedValue(550);
  const countryFindUnique = vi.fn().mockResolvedValue({ continent: { name: 'Asia' } });
  const eventGroupBy = vi.fn().mockResolvedValue([
    { countryCode: 'JP', _count: { _all: 17 } },
  ]);
  const prisma = new Proxy({}, {
    get: (_client, model) => {
      if (model === 'city') return { findMany: cityFindMany, count: cityCount, groupBy: cityGroupBy };
      if (model === 'country') return { findMany: countryFindMany, findUnique: countryFindUnique, count: countryCount };
      if (model === 'event') return { groupBy: eventGroupBy };
      return {};
    },
  }) as any;

  beforeEach(() => {
    app = Fastify();
    registerCatalogRoutes(app, prisma);
    cityFindMany.mockClear();
    cityCount.mockClear();
    cityGroupBy.mockClear();
    countryFindMany.mockClear();
    countryCount.mockClear();
    countryFindUnique.mockClear();
    eventGroupBy.mockClear();
  });

  it('returns only the directory fields and avoids loading city profiles', async () => {
    const response = await app.inject({ method: 'GET', url: '/cities/directory' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      success: true,
      data: {
        items: [{ slug: 'pk-lahore', name: 'Lahore' }],
        pagination: { page: 1, perPage: 12, total: 42, totalPages: 4 },
      },
    });
    expect(cityFindMany).toHaveBeenCalledWith({
      where: { isVerifiedCity: true },
      orderBy: { name: 'asc' },
      skip: 0,
      take: 12,
      select: { slug: true, name: true },
    });
    expect(cityCount).toHaveBeenCalledWith({ where: { isVerifiedCity: true } });
  });

  it('filters and paginates the lightweight directory using the requested search term', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/cities/directory?q=lahore&page=2&perPage=10&aliasSlugs=pk-lahore&excludeSlugs=pk-lahore-airport',
    });

    expect(response.statusCode).toBe(200);
    expect(cityFindMany).toHaveBeenCalledWith({
      where: {
        isVerifiedCity: true,
        AND: [
          {
            OR: [
              { name: { contains: 'lahore', mode: 'insensitive' } },
              { slug: { in: ['pk-lahore'] } },
            ],
          },
          { slug: { notIn: ['pk-lahore-airport'] } },
        ],
      },
      orderBy: { name: 'asc' },
      skip: 10,
      take: 10,
      select: { slug: true, name: true },
    });
    expect(cityCount).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ isVerifiedCity: true }),
    }));
  });

  it('counts verified cities without fetching city rows', async () => {
    const response = await app.inject({ method: 'GET', url: '/cities/count' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ success: true, data: 42 });
    expect(cityCount).toHaveBeenCalledWith({ where: { isVerifiedCity: true } });
    expect(cityFindMany).not.toHaveBeenCalled();
  });

  it('returns only country directory fields with pagination and no grouped profile counts', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/countries/directory?q=asia&continent=Asia&page=2&perPage=700',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      success: true,
      data: {
        items: [{ code: 'JP', name: 'Japan', continent: 'Asia', events: 17 }],
        pagination: { page: 2, perPage: 500, total: 550, totalPages: 2 },
      },
    });
    expect(countryFindMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { name: { contains: 'asia', mode: 'insensitive' } },
          { code: { contains: 'asia', mode: 'insensitive' } },
        ],
        continent: { name: 'Asia' },
      },
      orderBy: { name: 'asc' },
      skip: 500,
      take: 500,
      select: { code: true, name: true, continent: { select: { name: true } } },
    });
    expect(countryCount).toHaveBeenCalledWith({
      where: {
        OR: [
          { name: { contains: 'asia', mode: 'insensitive' } },
          { code: { contains: 'asia', mode: 'insensitive' } },
        ],
        continent: { name: 'Asia' },
      },
    });
    expect(eventGroupBy).toHaveBeenCalledWith({
      by: ['countryCode'],
      _count: { _all: true },
      where: { countryCode: { in: ['JP'] } },
    });
    expect(response.json().data.items[0]).not.toHaveProperty('profile');
  });

  it('omits event-count aggregation when a directory consumer does not need event labels', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/countries/directory?continent=Asia&perPage=100&includeEventCounts=false',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.items).toEqual([
      { code: 'JP', name: 'Japan', continent: 'Asia' },
    ]);
    expect(eventGroupBy).not.toHaveBeenCalled();
  });

  it('returns a lightweight paginated country city directory with the existing city eligibility rules', async () => {
    cityFindMany.mockResolvedValueOnce([{ slug: 'pk-lahore', name: 'Lahore', countryCode: 'PK' }]);
    const response = await app.inject({
      method: 'GET',
      url: '/countries/PK/cities/directory?page=2&perPage=10',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toEqual({
      items: [{ slug: 'pk-lahore', name: 'Lahore', countryCode: 'PK' }],
      pagination: { page: 2, perPage: 10, total: 42, totalPages: 5 },
    });
    expect(countryFindUnique).toHaveBeenCalledWith({
      where: { code: 'PK' },
      select: { continent: { select: { name: true } } },
    });
    expect(cityFindMany).toHaveBeenCalledWith({
      where: { countryCode: 'PK' },
      orderBy: { name: 'asc' },
      skip: 10,
      take: 10,
      select: { slug: true, name: true, countryCode: true },
    });
    expect(cityCount).toHaveBeenCalledWith({ where: { countryCode: 'PK' } });
  });

  it('limits the South America city directory to verified cities, matching the existing endpoint', async () => {
    countryFindUnique.mockResolvedValueOnce({ continent: { name: 'South America' } });

    const response = await app.inject({
      method: 'GET',
      url: '/countries/AR/cities/directory',
    });

    expect(response.statusCode).toBe(200);
    expect(cityFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { countryCode: 'AR', isVerifiedCity: true },
      select: { slug: true, name: true, countryCode: true },
    }));
    expect(cityCount).toHaveBeenCalledWith({
      where: { countryCode: 'AR', isVerifiedCity: true },
    });
  });

  it('searches country cities on the server without loading profiles', async () => {
    cityFindMany.mockResolvedValueOnce([{ slug: 'pk-lahore', name: 'Lahore', countryCode: 'PK' }]);
    const response = await app.inject({
      method: 'GET',
      url: '/countries/PK/cities/directory?q=lahore&page=1&perPage=12',
    });

    expect(response.statusCode).toBe(200);
    expect(cityFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        countryCode: 'PK',
        OR: [
          { name: { contains: 'lahore', mode: 'insensitive' } },
          { slug: { contains: 'lahore', mode: 'insensitive' } },
        ],
      },
      select: { slug: true, name: true, countryCode: true },
    }));
    expect(cityCount).toHaveBeenCalledWith({
      where: {
        countryCode: 'PK',
        OR: [
          { name: { contains: 'lahore', mode: 'insensitive' } },
          { slug: { contains: 'lahore', mode: 'insensitive' } },
        ],
      },
    });
  });

  it('sorts country cities in descending name order when requested', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/countries/PK/cities/directory?sort=name%3Adesc',
    });

    expect(response.statusCode).toBe(200);
    expect(cityFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { countryCode: 'PK' },
      orderBy: { name: 'desc' },
    }));
  });

  it('filters the country list by continent and applies descending name order', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/countries?q=Jap&continent=Asia&sort=name%3Adesc&page=2&perPage=10',
    });

    expect(response.statusCode).toBe(200);
    expect(countryFindMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { name: { contains: 'Jap', mode: 'insensitive' } },
          { code: { contains: 'Jap', mode: 'insensitive' } },
        ],
        continent: { name: 'Asia' },
      },
      orderBy: { name: 'desc' },
      skip: 10,
      take: 10,
      include: { continent: true },
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
