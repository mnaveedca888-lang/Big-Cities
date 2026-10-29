import 'dotenv/config';
import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import { PrismaClient } from '@prisma/client';
import registerAuthRoutes from './auth/auth.controller';
import registerUserRoutes from './users/user.controller';
import registerDashboardRoutes from './dashboard/dashboard.controller';
import registerCatalogRoutes from './catalog/catalog.controller';
import registerNotificationsRoutes from './notifications/notifications.controller';
import registerUploadRoutes from './uploads/uploads.controller';
import registerAdminRoutes from './admin/admin.controller';
import registerEventRoutes, { EVENT_SLUG_MAX_LENGTH } from './events/event.controller';
import registerSearchRoutes from './search/search.controller';
import { registerEventDiscoveryRoutes } from './events/discovery.controller';
import { startEventSyncScheduler } from './events/ingestion/scheduler';
import { databaseWritesEnabled, registerStagingWriteGuard } from './staging-write-guard';
import { installLocalImageWriteGuard } from './images/local-image';
import { getCorsOptions } from './cors';
import { registerHealthRoutes } from './health';

const prisma = new PrismaClient();
installLocalImageWriteGuard(prisma);

async function start() {
  const app = Fastify({ logger: true, maxParamLength: EVENT_SLUG_MAX_LENGTH });

  await app.register(helmet as any, {
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });
  await app.register(cors as any, getCorsOptions());
  registerStagingWriteGuard(app);
  // lightweight in-memory rate limiter for auth endpoints (per-IP)
  const rateMap = new Map<string, { count: number; windowStart: number }>();
  const RATE_MAX = 20;
  const RATE_WINDOW_MS = 60 * 1000;
  app.addHook('preHandler', async (request, reply) => {
    try {
      const url = request.routerPath || request.url;
      if (!url || !url.startsWith('/auth')) return;
      const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';
      const now = Date.now();
      const entry = rateMap.get(ip as string);
      if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
        rateMap.set(ip as string, { count: 1, windowStart: now });
        return;
      }
      entry.count += 1;
      if (entry.count > RATE_MAX) {
        reply.code(429).send({ success: false, error: { message: 'Too many requests' } });
        throw new Error('Rate limit');
      }
    } catch (err) {
      if ((err as any).message === 'Rate limit') throw err;
    }
  });

  registerHealthRoutes(app, prisma);

  const port = Number(process.env.PORT || 4001);

  try {
    await prisma.$connect();
    app.log.info('Prisma connected');
  } catch (err) {
    app.log.error('Prisma connection failed', err as any);
  }

  await app.register(fastifyMultipart, { limits: { fileSize: 20 * 1024 * 1024 } });

  registerUploadRoutes(app, prisma as any);

  registerAuthRoutes(app, prisma as any);
  registerUserRoutes(app, prisma as any);
  registerDashboardRoutes(app, prisma as any);
  registerCatalogRoutes(app, prisma as any);
  registerNotificationsRoutes(app, prisma as any);
  registerAdminRoutes(app, prisma as any);
  registerEventRoutes(app, prisma as any);
  registerSearchRoutes(app, prisma as any);
  registerEventDiscoveryRoutes(app, prisma as any);

  const syncEnabled = databaseWritesEnabled() && process.env.EVENT_SYNC_ENABLED === 'true';
  const stopEventSyncScheduler = syncEnabled ? startEventSyncScheduler(prisma, app.log) : null;
  if (!stopEventSyncScheduler) {
    app.log.info('Automatic event synchronization remains disabled for staging safety');
  }
  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    app.log.info(`Shutting down on ${signal}`);
    stopEventSyncScheduler?.();
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.once('SIGINT', () => { void shutdown('SIGINT'); });
  process.once('SIGTERM', () => { void shutdown('SIGTERM'); });

  await app.listen({ port, host: '0.0.0.0' });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
