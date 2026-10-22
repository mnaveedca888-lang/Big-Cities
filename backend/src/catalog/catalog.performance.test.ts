import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import registerCatalogRoutes from './catalog.controller';

describe('city directory read endpoints', () => {
  let app: ReturnType<typeof Fastify>;
  const cityFindMany = vi.fn().mockResolvedValue([
    { slug: 'pk-lahore', name: 'Lahore' },
  ]);
  const cityCount = vi.fn().mockResolvedValue(42);
  const prisma = new Proxy({}, {
    get: (_client, model) => {
      if (model !== 'city') return {};
      return { findMany: cityFindMany, count: cityCount };
    },
  }) as any;

  beforeEach(() => {
    app = Fastify();
    registerCatalogRoutes(app, prisma);
    cityFindMany.mockClear();
    cityCount.mockClear();
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

  afterEach(async () => {
    await app.close();
  });
});
