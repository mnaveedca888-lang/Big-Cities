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
  let countryProfile: Record<string, unknown> | null;
  let auditLogCreate: ReturnType<typeof vi.fn>;
  let adminToken: string;
  let memberToken: string;

  beforeEach(async () => {
    for (const key of testEnvKeys) previousEnv.set(key, process.env[key]);
    process.env.DATABASE_WRITES_ENABLED = 'false';
    process.env.ENABLE_STAGING_CANDIDATE_CORS = 'true';
    process.env.NODE_ENV = 'production';
    process.env.JWT_ACCESS_TOKEN_SECRET = 'staging-country-update-test-secret';
    countryProfile = null;

    countryUpdate = vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      code: 'PK',
      name: 'Pakistan',
      continentId: null,
      continent: null,
      profile: countryProfile,
      ...data,
    }));
    const countryFindUnique = vi.fn(async () => ({
      code: 'PK',
      name: 'Pakistan',
      continentId: null,
      continent: null,
      profile: countryProfile,
    }));
    auditLogCreate = vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'audit-1', ...data }));
    const transaction = {
      country: { findUnique: countryFindUnique, update: countryUpdate },
      $queryRaw: vi.fn(async (query: { sql: string; values: unknown[] }) => {
        if (query.sql.includes('pg_advisory_xact_lock')) return [];
        if (query.sql.includes('"profile" ->>')) return [{ matches: true }];
        if (query.sql.includes('"image_json_object_keys"')) return [{ referenced: false }];
        if (query.sql.includes('FROM "Upload"')) {
          const fileKey = String(query.values[0]);
          const url = `/images/uploads/${fileKey}`;
          return [{ userId: 'admin-user', url, deletedAt: null }];
        }
        if (query.sql.includes('FROM "ImageCleanupJob"')) return [{ status: 'pending', completedAt: null }];
        throw new Error(`Unexpected SQL in country update test: ${query.sql}`);
      }),
      auditLog: { create: auditLogCreate },
    };
    prisma = {
      $transaction: vi.fn(async (callback: (tx: typeof transaction) => unknown) => callback(transaction)),
      user: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => ({
          role: { name: where.id === 'admin-user' ? 'admin' : 'member' },
        })),
      },
      country: {
        findUnique: countryFindUnique,
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

  it('allows an authorized admin through the country validation and update path with candidate CORS', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/countries/PK',
      headers: {
        authorization: `Bearer ${adminToken}`,
        origin: STAGING_CANDIDATE_FRONTEND_ORIGIN,
      },
      payload: { name: 'Test Name' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe(STAGING_CANDIDATE_FRONTEND_ORIGIN);
    expect(response.json()).toMatchObject({ success: true, data: { code: 'PK', name: 'Test Name' } });
    expect(countryUpdate).toHaveBeenCalledWith({
      where: { code: 'PK' },
      data: { name: 'Test Name', continentId: null, profile: null },
    });
  });

  it('associates the exact old and new private images with the saved country update', async () => {
    const previousUrl = '/images/uploads/admin-user/uploads/1000-old.png';
    const replacementUrl = '/images/uploads/admin-user/uploads/2000-new.png';
    countryProfile = { heroImageUrl: previousUrl };

    const response = await app.inject({
      method: 'PATCH',
      url: '/countries/PK',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { profile: { heroImageUrl: replacementUrl } },
    });

    expect(response.statusCode).toBe(200);
    expect(auditLogCreate).toHaveBeenCalledWith({
      data: {
        userId: 'admin-user',
        action: 'image-replacement-saved',
        meta: JSON.stringify({
          entity: 'country',
          entityId: 'PK',
          field: 'heroImageUrl',
          previousKey: 'admin-user/uploads/1000-old.png',
          replacementKey: 'admin-user/uploads/2000-new.png',
        }),
      },
    });
  });

  it.each([
    ['unauthenticated', undefined, 401],
    ['non-admin', 'member', 403],
  ])('rejects %s country updates with candidate CORS headers', async (_label, role, status) => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/countries/PK',
      headers: {
        ...(role ? { authorization: `Bearer ${memberToken}` } : {}),
        origin: STAGING_CANDIDATE_FRONTEND_ORIGIN,
      },
      payload: { name: 'Must Not Persist' },
    });

    expect(response.statusCode).toBe(status);
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
