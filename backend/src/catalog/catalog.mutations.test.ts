import Fastify from 'fastify';
import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import registerCatalogRoutes from './catalog.controller';

describe('catalog mutation validation and relationship safeguards', () => {
  const originalSecret = process.env.JWT_ACCESS_TOKEN_SECRET;
  let app: ReturnType<typeof Fastify>;
  let token: string;
  let countryFindUnique: ReturnType<typeof vi.fn>;
  let countryDelete: ReturnType<typeof vi.fn>;
  let countryCreate: ReturnType<typeof vi.fn>;
  let cityFindUnique: ReturnType<typeof vi.fn>;
  let cityCreate: ReturnType<typeof vi.fn>;
  let cityUpdate: ReturnType<typeof vi.fn>;
  let cityDelete: ReturnType<typeof vi.fn>;
  let cityCount: ReturnType<typeof vi.fn>;
  let eventCount: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    process.env.JWT_ACCESS_TOKEN_SECRET = 'catalog-mutation-test-secret';
    token = jwt.sign({ sub: 'admin-user' }, process.env.JWT_ACCESS_TOKEN_SECRET);
    countryFindUnique = vi.fn().mockResolvedValue(null);
    countryDelete = vi.fn();
    countryCreate = vi.fn();
    cityFindUnique = vi.fn().mockResolvedValue(null);
    cityCreate = vi.fn();
    cityUpdate = vi.fn();
    cityDelete = vi.fn();
    cityCount = vi.fn().mockResolvedValue(0);
    eventCount = vi.fn().mockResolvedValue(0);
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'admin-user', role: { name: 'admin' } }) },
      country: {
        findUnique: countryFindUnique,
        create: countryCreate,
        delete: countryDelete,
        count: vi.fn().mockResolvedValue(0),
      },
      city: {
        findUnique: cityFindUnique,
        create: cityCreate,
        update: cityUpdate,
        delete: cityDelete,
        count: cityCount,
      },
      event: { count: eventCount },
      continent: { findUnique: vi.fn().mockResolvedValue({ id: 'continent-1' }) },
    } as any;
    app = Fastify();
    registerCatalogRoutes(app, prisma);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    if (originalSecret === undefined) delete process.env.JWT_ACCESS_TOKEN_SECRET;
    else process.env.JWT_ACCESS_TOKEN_SECRET = originalSecret;
  });

  it('rejects duplicate country codes before creating a record', async () => {
    countryFindUnique.mockResolvedValueOnce({ code: 'JP' });
    const response = await app.inject({
      method: 'POST',
      url: '/countries',
      headers: { authorization: `Bearer ${token}` },
      payload: { code: 'jp', name: 'Japan' },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ error: { message: 'Country code already exists' } });
    expect(countryCreate).not.toHaveBeenCalled();
  });

  it('rejects a city whose country code differs from the route country', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/countries/PK/cities',
      headers: { authorization: `Bearer ${token}` },
      payload: { slug: 'us-new-york', name: 'New York', countryCode: 'US' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: { message: 'City countryCode must match URL country code' } });
    expect(countryFindUnique).not.toHaveBeenCalled();
    expect(cityCreate).not.toHaveBeenCalled();
  });

  it('rejects moving a city to a country that does not exist', async () => {
    cityFindUnique.mockResolvedValueOnce({ slug: 'pk-lahore', countryCode: 'PK' });
    countryFindUnique.mockResolvedValueOnce(null);
    const response = await app.inject({
      method: 'PATCH',
      url: '/cities/pk-lahore',
      headers: { authorization: `Bearer ${token}` },
      payload: { countryCode: 'ZZ' },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ error: { message: 'Country not found' } });
    expect(cityUpdate).not.toHaveBeenCalled();
  });

  it('prevents deleting countries with associated cities or events', async () => {
    countryFindUnique.mockResolvedValueOnce({ code: 'PK', name: 'Pakistan' });
    cityCount.mockResolvedValueOnce(2);
    eventCount.mockResolvedValueOnce(0);
    const response = await app.inject({
      method: 'DELETE',
      url: '/countries/PK',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ error: { message: 'Country cannot be deleted while cities or events are associated with it.' } });
    expect(countryDelete).not.toHaveBeenCalled();
  });

  it('requires admin authorization for country creation', async () => {
    const userFindUnique = vi.fn().mockResolvedValue({ id: 'regular-user', role: { name: 'user' } });
    const unauthorizedApp = Fastify();
    registerCatalogRoutes(unauthorizedApp, {
      user: { findUnique: userFindUnique },
      country: { create: countryCreate },
    } as any);
    await unauthorizedApp.ready();
    const regularToken = jwt.sign({ sub: 'regular-user' }, 'catalog-mutation-test-secret');

    const response = await unauthorizedApp.inject({
      method: 'POST',
      url: '/countries',
      headers: { authorization: `Bearer ${regularToken}` },
      payload: { code: 'JP', name: 'Japan' },
    });

    expect(response.statusCode).toBe(403);
    expect(countryCreate).not.toHaveBeenCalled();
    await unauthorizedApp.close();
  });
});
