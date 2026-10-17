import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import AuthService from '../auth/auth.service';
import { buildPagination } from '../utils/pagination';

function getBearerToken(request: any) {
  const authHeader = (request.headers.authorization || '') as string;
  return authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
}

const createNotificationSchema = z.object({
  title: z.string().min(1),
  body: z.string().optional(),
  userId: z.string().optional(),
});

export function registerNotificationsRoutes(app: FastifyInstance, prisma: PrismaClient) {
  const auth = new AuthService(prisma as any);

  app.get('/notifications', async (request, reply) => {
    try {
      const token = getBearerToken(request);
      if (!token) return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
      const userId = await auth.verifyAccessToken(token);
      const page = Number((request.query as any).page || 1);
      const perPage = Number((request.query as any).perPage || 20);
      const [items, total] = await Promise.all([
        prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * perPage, take: perPage }),
        prisma.notification.count({ where: { userId } }),
      ]);
      reply.send({ success: true, data: { items, pagination: buildPagination(page, perPage, total) } });
    } catch (err: any) {
      app.log.warn('Notifications list failed', err);
      reply.code(401).send({ success: false, error: { message: 'Invalid token' } });
    }
  });

  app.post('/notifications', async (request, reply) => {
    try {
      const token = getBearerToken(request);
      if (!token) return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
      const actorId = await auth.verifyAccessToken(token);
      const actor = await prisma.user.findUnique({ where: { id: actorId }, include: { role: true } });
      if (!actor || actor.role?.name !== 'admin') return reply.code(403).send({ success: false, error: { message: 'Forbidden' } });
      const body = createNotificationSchema.parse(request.body || {});
      const notification = await prisma.notification.create({ data: { userId: body.userId || actorId, title: body.title, body: body.body || null } });
      reply.code(201).send({ success: true, data: notification });
    } catch (err: any) {
      if (err && err.name === 'ZodError') return reply.code(400).send({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid input' } });
      app.log.warn('Notification create failed', err);
      reply.code(400).send({ success: false, error: { message: err.message || 'Could not create notification' } });
    }
  });

  app.patch('/notifications/:id/read', async (request, reply) => {
    try {
      const token = getBearerToken(request);
      if (!token) return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
      const userId = await auth.verifyAccessToken(token);
      const { id } = request.params as { id: string };
      const updated = await prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });
      reply.send({ success: true, data: { updatedCount: updated.count } });
    } catch (err: any) {
      app.log.warn('Mark notification read failed', err);
      reply.code(400).send({ success: false, error: { message: err.message || 'Could not mark notification as read' } });
    }
  });
}

export default registerNotificationsRoutes;
