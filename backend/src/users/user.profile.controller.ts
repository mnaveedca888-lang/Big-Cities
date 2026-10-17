import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import AuthService from '../auth/auth.service';
import { buildPagination } from '../utils/pagination';

function getBearerToken(request: any) {
  const authHeader = (request.headers.authorization || '') as string;
  return authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
}

function sanitizeUser(user: any) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role?.name ?? 'member',
    avatar: user.avatarUrl ?? '',
    isEmailVerified: Boolean(user.isEmailVerified),
  };
}

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

const preferencesSchema = z.object({
  compactMode: z.boolean().optional(),
  reduceMotion: z.boolean().optional(),
  language: z.string().optional(),
});

export function registerUserProfileRoutes(app: FastifyInstance, prisma: PrismaClient) {
  const auth = new AuthService(prisma as any);

  app.get('/users/me', async (request, reply) => {
    try {
      const token = getBearerToken(request);
      if (!token) return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
      const userId = await auth.verifyAccessToken(token);
      const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
      if (!user) return reply.code(404).send({ success: false, error: { message: 'User not found' } });
      reply.send({ success: true, data: sanitizeUser(user) });
    } catch (err: any) {
      app.log.warn('Users me failed', err);
      reply.code(401).send({ success: false, error: { message: 'Invalid token' } });
    }
  });

  app.patch('/users/me', async (request, reply) => {
    try {
      const token = getBearerToken(request);
      if (!token) return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
      const userId = await auth.verifyAccessToken(token);
      const body = updateProfileSchema.parse(request.body || {});
      const updated = await prisma.user.update({ where: { id: userId }, data: body, include: { role: true } });
      reply.send({ success: true, data: sanitizeUser(updated) });
    } catch (err: any) {
      if (err && err.name === 'ZodError') return reply.code(400).send({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid input' } });
      app.log.warn('Users me update failed', err);
      reply.code(400).send({ success: false, error: { message: err.message || 'Failed to update profile' } });
    }
  });

  app.get('/users/me/saved-events', async (request, reply) => {
    try {
      const token = getBearerToken(request);
      if (!token) return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
      const userId = await auth.verifyAccessToken(token);
      const page = Number((request.query as any).page || 1);
      const perPage = Number((request.query as any).perPage || 20);
      const [items, total] = await Promise.all([
        prisma.savedEvent.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        prisma.savedEvent.count({ where: { userId } }),
      ]);
      reply.send({ success: true, data: { items, pagination: buildPagination(page, perPage, total) } });
    } catch (err: any) {
      app.log.warn('Saved events list failed', err);
      reply.code(401).send({ success: false, error: { message: 'Invalid token' } });
    }
  });

  app.post('/users/me/saved-events', async (request, reply) => {
    try {
      const token = getBearerToken(request);
      if (!token) return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
      const userId = await auth.verifyAccessToken(token);
      const body = z.object({ eventId: z.string() }).parse(request.body || {});
      const event = await prisma.event.findUnique({ where: { id: body.eventId }, select: { id: true } });
      if (!event) return reply.code(404).send({ success: false, error: { message: 'Not found' } });
      const saved = await prisma.savedEvent.upsert({
        where: { userId_eventId: { userId, eventId: body.eventId } },
        update: {},
        create: { userId, eventId: body.eventId },
      });
      reply.code(201).send({ success: true, data: saved });
    } catch (err: any) {
      if (err && err.name === 'ZodError') return reply.code(400).send({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid input' } });
      app.log.warn('Saved event create failed', err);
      reply.code(400).send({ success: false, error: { message: err.message || 'Could not save event' } });
    }
  });

  app.delete('/users/me/saved-events/:eventId', async (request, reply) => {
    try {
      const token = getBearerToken(request);
      if (!token) return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
      const userId = await auth.verifyAccessToken(token);
      const { eventId } = request.params as { eventId: string };
      await prisma.savedEvent.deleteMany({ where: { userId, eventId } });
      reply.code(204).send();
    } catch (err: any) {
      app.log.warn('Saved event delete failed', err);
      reply.code(400).send({ success: false, error: { message: err.message || 'Could not remove saved event' } });
    }
  });

  app.get('/users/me/preferences', async (request, reply) => {
    try {
      const token = getBearerToken(request);
      if (!token) return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
      const userId = await auth.verifyAccessToken(token);
      const user = await prisma.user.findUnique({ where: { id: userId } });
      reply.send({ success: true, data: { compactMode: false, reduceMotion: false, language: 'en' } });
    } catch (err: any) {
      app.log.warn('Preferences read failed', err);
      reply.code(401).send({ success: false, error: { message: 'Invalid token' } });
    }
  });

  app.patch('/users/me/preferences', async (request, reply) => {
    try {
      const token = getBearerToken(request);
      if (!token) return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
      const userId = await auth.verifyAccessToken(token);
      const body = preferencesSchema.parse(request.body || {});
      reply.send({ success: true, data: body });
    } catch (err: any) {
      if (err && err.name === 'ZodError') return reply.code(400).send({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid input' } });
      app.log.warn('Preferences update failed', err);
      reply.code(400).send({ success: false, error: { message: err.message || 'Could not update preferences' } });
    }
  });
}

export default registerUserProfileRoutes;
