import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import AuthService from '../auth/auth.service';
import { buildPagination } from '../utils/pagination';
import { syncPakistanEvents } from '../events/ingestion/sync-service';
import { databaseWritesEnabled } from '../staging-write-guard';

function getBearerToken(request: any) {
  const authHeader = (request.headers.authorization || '') as string;
  return authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
}

function isAdmin(prisma: PrismaClient, auth: AuthService, token: string | null) {
  return (async () => {
    if (!token) return false;
    const userId = await auth.verifyAccessToken(token).catch(() => null);
    if (!userId) return false;
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    return user?.role?.name === 'admin';
  })();
}

export function registerAdminRoutes(app: FastifyInstance, prisma: PrismaClient) {
  const auth = new AuthService(prisma as any);

  app.post('/admin/events/sync', async (request, reply) => {
    if (!databaseWritesEnabled() || process.env.EVENT_SYNC_ENABLED !== 'true') {
      return reply.code(403).send({ success: false, error: { message: 'Event sync is disabled in staging.' } });
    }
    try {
      const token = getBearerToken(request);
      if (!token) return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
      const ok = await isAdmin(prisma, auth, token);
      if (!ok) return reply.code(403).send({ success: false, error: { message: 'Forbidden' } });
      const result = await syncPakistanEvents(prisma, app.log);
      return reply.send({ success: true, data: result });
    } catch (err: any) {
      app.log.error('Pakistan event sync failed', err);
      return reply.code(500).send({ success: false, error: { message: 'Event synchronization failed' } });
    }
  });

  app.get('/roles', async (request, reply) => {
    try {
      const token = getBearerToken(request);
      if (!token) return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
      const ok = await isAdmin(prisma, auth, token);
      if (!ok) return reply.code(403).send({ success: false, error: { message: 'Forbidden' } });
      const roles = await prisma.role.findMany({ orderBy: { name: 'asc' } });
      reply.send({ success: true, data: roles });
    } catch (err: any) {
      app.log.warn('Roles list failed', err);
      reply.code(400).send({ success: false, error: { message: err.message || 'Could not list roles' } });
    }
  });

  app.get('/permissions', async (request, reply) => {
    try {
      const token = getBearerToken(request);
      if (!token) return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
      const ok = await isAdmin(prisma, auth, token);
      if (!ok) return reply.code(403).send({ success: false, error: { message: 'Forbidden' } });
      const permissions = await prisma.permission.findMany({ orderBy: { name: 'asc' } });
      reply.send({ success: true, data: permissions });
    } catch (err: any) {
      app.log.warn('Permissions list failed', err);
      reply.code(400).send({ success: false, error: { message: err.message || 'Could not list permissions' } });
    }
  });

  app.get('/admin/audit-logs', async (request, reply) => {
    try {
      const token = getBearerToken(request);
      if (!token) return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
      const ok = await isAdmin(prisma, auth, token);
      if (!ok) return reply.code(403).send({ success: false, error: { message: 'Forbidden' } });
      const page = Number((request.query as any).page || 1);
      const perPage = Number((request.query as any).perPage || 20);
      const [items, total] = await Promise.all([
        prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, skip: (page - 1) * perPage, take: perPage }),
        prisma.auditLog.count(),
      ]);
      reply.send({ success: true, data: { items, pagination: buildPagination(page, perPage, total) } });
    } catch (err: any) {
      app.log.warn('Audit logs list failed', err);
      reply.code(400).send({ success: false, error: { message: err.message || 'Could not list audit logs' } });
    }
  });
}

export default registerAdminRoutes;
