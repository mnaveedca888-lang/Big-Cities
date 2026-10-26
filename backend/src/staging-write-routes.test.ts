import Fastify from 'fastify';
import fs from 'fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import registerAdminRoutes from './admin/admin.controller';
import registerAuthRoutes from './auth/auth.controller';
import registerCatalogRoutes from './catalog/catalog.controller';
import registerEventRoutes from './events/event.controller';
import { registerEventDiscoveryRoutes } from './events/discovery.controller';
import registerNotificationsRoutes from './notifications/notifications.controller';
import registerUploadRoutes from './uploads/uploads.controller';
import registerUserRoutes from './users/user.controller';
import { registerStagingWriteGuard } from './staging-write-guard';

const { discoverAndStoreEvents } = vi.hoisted(() => ({
  discoverAndStoreEvents: vi.fn(),
}));

vi.mock('./events/discovery.service', () => ({
  DAILY_EVENT_CATEGORIES: ['Concerts'],
  discoverAndStoreEvents,
}));

const mutatingPrismaMethods = new Set(['create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany']);
const guardedEnvKeys = ['DATABASE_WRITES_ENABLED', 'UPLOADS_ENABLED', 'EVENT_DISCOVERY_ENABLED', 'EVENT_SYNC_ENABLED'] as const;

describe('staging write route protection', () => {
  let app: ReturnType<typeof Fastify>;
  let writeMock: ReturnType<typeof vi.fn>;
  let previousEnv: Map<string, string | undefined>;
  let mkdirSpy: ReturnType<typeof vi.spyOn>;
  let writeFileSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    previousEnv = new Map(guardedEnvKeys.map((key) => [key, process.env[key]]));
    process.env.DATABASE_WRITES_ENABLED = 'false';
    process.env.UPLOADS_ENABLED = 'true';
    process.env.EVENT_DISCOVERY_ENABLED = 'true';
    process.env.EVENT_SYNC_ENABLED = 'true';
    discoverAndStoreEvents.mockClear();
    writeMock = vi.fn().mockResolvedValue({});
    mkdirSpy = vi.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined as any);
    writeFileSpy = vi.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);

    const prisma = new Proxy({}, {
      get: (_client, model) => {
        if (model === '$queryRaw') return vi.fn().mockResolvedValue([{ result: 1 }]);
        return new Proxy({}, {
          get: (_delegate, method) => {
            if (mutatingPrismaMethods.has(String(method))) return writeMock;
            if (method === 'findMany') return vi.fn().mockResolvedValue([]);
            if (method === 'count') return vi.fn().mockResolvedValue(0);
            return vi.fn().mockResolvedValue(null);
          },
        });
      },
    }) as any;

    app = Fastify();
    registerStagingWriteGuard(app);
    registerAuthRoutes(app, prisma);
    registerUserRoutes(app, prisma);
    registerNotificationsRoutes(app, prisma);
    registerCatalogRoutes(app, prisma);
    registerEventRoutes(app, prisma);
    registerAdminRoutes(app, prisma);
    registerUploadRoutes(app, prisma);
    registerEventDiscoveryRoutes(app, prisma);
    app.get('/health/live', async () => ({ status: 'ok' }));
    app.get('/health/ready', async () => {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ready' };
    });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    mkdirSpy.mockRestore();
    writeFileSpy.mockRestore();
    for (const key of guardedEnvKeys) {
      const value = previousEnv.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it.each([
    ['POST', '/auth/register'],
    ['POST', '/auth/refresh'],
    ['POST', '/auth/logout'],
    ['PATCH', '/users/me'],
    ['POST', '/users/me/saved-events'],
    ['DELETE', '/users/me/saved-events/event-id'],
    ['PATCH', '/users/me/preferences'],
    ['POST', '/notifications'],
    ['PATCH', '/notifications/notification-id/read'],
    ['POST', '/categories'],
    ['PATCH', '/categories/category'],
    ['DELETE', '/categories/category'],
    ['POST', '/countries'],
    ['DELETE', '/countries/PK'],
    ['POST', '/countries/PK/cities'],
    ['PATCH', '/cities/lahore'],
    ['DELETE', '/cities/lahore'],
    ['POST', '/events'],
    ['PATCH', '/events/event'],
    ['DELETE', '/events/event'],
    ['POST', '/admin/events/sync'],
    ['POST', '/uploads/presign'],
    ['POST', '/uploads/files'],
  ])('blocks %s %s before database or filesystem writes', async (method, url) => {
    const response = await app.inject({ method: method as any, url, payload: {} });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ error: { code: 'STAGING_READ_ONLY' } });
    expect(writeMock).not.toHaveBeenCalled();
    expect(mkdirSpy).not.toHaveBeenCalled();
    expect(writeFileSpy).not.toHaveBeenCalled();
  });

  it('blocks country updates while staging writes are disabled', async () => {
    const response = await app.inject({ method: 'PATCH', url: '/countries/PK', payload: { name: 'Pakistan' } });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ error: { code: 'STAGING_READ_ONLY' } });
    expect(writeMock).not.toHaveBeenCalled();
    expect(mkdirSpy).not.toHaveBeenCalled();
    expect(writeFileSpy).not.toHaveBeenCalled();
  });

  it('lets login reach authentication without enabling database writes', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'admin@example.test', password: 'provided-by-test' },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ error: { code: 'INVALID_CREDENTIALS' } });
    expect(writeMock).not.toHaveBeenCalled();
    expect(mkdirSpy).not.toHaveBeenCalled();
    expect(writeFileSpy).not.toHaveBeenCalled();
  });

  it('blocks GET discovery even when its feature flag is enabled', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/events/discover?country=Pakistan&countryCode=PK&category=Concerts',
    });

    expect(response.statusCode).toBe(403);
    expect(discoverAndStoreEvents).not.toHaveBeenCalled();
    expect(writeMock).not.toHaveBeenCalled();
  });

  it('keeps health and read-only GET endpoints available', async () => {
    const live = await app.inject({ method: 'GET', url: '/health/live' });
    const ready = await app.inject({ method: 'GET', url: '/health/ready' });
    const categories = await app.inject({ method: 'GET', url: '/categories' });

    expect(live.statusCode).toBe(200);
    expect(ready.statusCode).toBe(200);
    expect(categories.statusCode).toBe(200);
    expect(writeMock).not.toHaveBeenCalled();
  });
});