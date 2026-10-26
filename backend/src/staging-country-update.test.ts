import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AuthService from './auth/auth.service';
import registerCatalogRoutes from './catalog/catalog.controller';
import { getCorsOptions, STAGING_CANDIDATE_FRONTEND_ORIGIN } from './cors';
import { registerStagingWriteGuard } from './staging-write-guard';

const apps: ReturnType<typeof Fastify>[] = [];
const previousEnv = new Map<string, string | undefined>();
const testEnvKeys = ['DATABASE_WRITES_ENABLED', 'ENABLE_STAGING_CANDIDATE_CORS', 'NODE_ENV', 'JWT_ACCESS_TOKEN_SECRET'];

describe('staging country update authorization', () => {
  let app: ReturnType<typeof Fastify>;
  let prisma: any;
  let countryUpdate: ReturnType<typeof vi.fn>;
  let adminToken: string;
  let memberToken: string;

  beforeEach(async () => {
    for (const key of testEnvKeys) previousEnv.set(key, process.env[key]);
    process.env.DATABASE_WRITES_ENABLED = 'false';
    process.env.ENABLE_STAGING_CANDIDATE_CORS = 'true';
    process.env.NODE_ENV = 'production';
    process.env.JWT_ACCESS_TOKEN_SECRET = 'staging-country-update-test-secret';

    countryUpdate = vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      code: 'PK',
      name: 'Pakistan',
      continentId: null,
      continent: null,
      profile: null,
      ...data,
    }));
    prisma = {
      user: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => ({
          role: { name: where.id === 'admin-user' ? 'admin' : 'member' },
        })),
      },
      country: {
        findUnique: vi.fn(async () => ({
          code: 'PK',
          name: 'Pakistan',
          continentId: null,
          continent: null,
          profile: null,
        })),
        update: countryUpdate,
      },
      city: { count: vi.fn(async () => 0) },
      event: { count: vi.fn(async () => 0) },
    };

    const auth = new AuthService(prisma as PrismaClient);
    adminToken = auth.signAccessToken('admin-user');
    memberToken = auth.signAccessToken('member-user');

    app = Fastify();
    apps.push(app);
    await app.register(cors, getCorsOptions());
    registerStagingWriteGuard(app);
    registerCatalogRoutes(app, prisma as PrismaClient);
    app.patch('/other-write', async () => ({ updated: true }));
    await app.ready();
  });

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((instance) => instance.close()));
    for (const key of testEnvKeys) {
      const value = previousEnv.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    previousEnv.clear();
  });

  it('blocks authorized admin country updates while writes are disabled', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/countries/PK',
      headers: {
        authorization: `Bearer ${adminToken}`,
        origin: STAGING_CANDIDATE_FRONTEND_ORIGIN,
      },
      payload: { name: 'Test Name' },
    });

    expect(response.statusCode).toBe(503);
    expect(response.headers['access-control-allow-origin']).toBe(STAGING_CANDIDATE_FRONTEND_ORIGIN);
    expect(response.json()).toMatchObject({ error: { code: 'STAGING_READ_ONLY' } });
    expect(countryUpdate).not.toHaveBeenCalled();
  });

  it.each([
    ['unauthenticated', undefined, 401],
    ['non-admin', 'member', 403],
  ])('blocks %s country updates before controller authorization with candidate CORS headers', async (_label, role) => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/countries/PK',
      headers: {
        ...(role ? { authorization: `Bearer ${memberToken}` } : {}),
        origin: STAGING_CANDIDATE_FRONTEND_ORIGIN,
      },
      payload: { name: 'Must Not Persist' },
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ error: { code: 'STAGING_READ_ONLY' } });
    expect(response.headers['access-control-allow-origin']).toBe(STAGING_CANDIDATE_FRONTEND_ORIGIN);
    expect(countryUpdate).not.toHaveBeenCalled();
  });

  it('continues to block unrelated write routes while returning candidate CORS headers', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/other-write',
      headers: { origin: STAGING_CANDIDATE_FRONTEND_ORIGIN },
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ error: { code: 'STAGING_READ_ONLY' } });
    expect(response.headers['access-control-allow-origin']).toBe(STAGING_CANDIDATE_FRONTEND_ORIGIN);
    expect(countryUpdate).not.toHaveBeenCalled();
  });
});
