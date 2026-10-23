import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import registerCatalogRoutes from './catalog.controller';

describe('catalog directory read endpoints', () => {
  let app: ReturnType<typeof Fastify>;
  const cityFindMany = vi.fn().mockResolvedValue([
    { slug: 'pk-lahore', name: 'Lahore' },
  ]);
  const cityCount = vi.fn().mockResolvedValue(42);
  const countryFindMany = vi.fn().mockResolvedValue([
    { code: 'JP', name: 'Japan', continent: { name: 'Asia' }, profile: { mustNotReturn: true } },
  ]);
  const countryCount = vi.fn().mockResolvedValue(550);
  const prisma = new Proxy({}, {
    get: (_client, model) => {
      if (model === 'city') return { findMany: cityFindMany, count: cityCount };
      if (model === 'country') return { findMany: countryFindMany, count: countryCount };
      return {};
    },
  }) as any;

  beforeEach(() => {
    app = Fastify();
    registerCatalogRoutes(app, prisma);
    cityFindMany.mockClear();
    cityCount.mockClear();
    countryFindMany.mockClear();
    countryCount.mockClear();
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
        items: [{ code: 'JP', name: 'Japan', continent: 'Asia' }],
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
    expect(response.json().data.items[0]).not.toHaveProperty('profile');
  });

  afterEach(async () => {
    await app.close();
  });
});
