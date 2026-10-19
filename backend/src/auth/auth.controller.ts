import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import AuthService from './auth.service';
import { z } from 'zod';
import { normalizeLocalImageUrl } from '../images/local-image';

const registerSchema = z.object({ name: z.string().min(1), email: z.string().email(), password: z.string().min(8) });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const refreshSchema = z.object({ refreshToken: z.string() });

function sanitizeUser(user: any) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role?.name ?? 'member',
    avatar: normalizeLocalImageUrl(user.avatarUrl) ?? '',
    isEmailVerified: Boolean(user.isEmailVerified),
  };
}

export function registerAuthRoutes(app: FastifyInstance, prisma: PrismaClient) {
  const service = new AuthService(prisma as any);

  app.post('/auth/register', async (request, reply) => {
    try {
      const body = registerSchema.parse(request.body);
      const user = await service.register(body);
      const { accessToken, refreshToken, expiresAt } = await service.createSessionAndTokens(user, {
        ip: request.ip,
        userAgent: request.headers['user-agent'] as string | undefined,
      });
      const safeUser = sanitizeUser({ ...user, role: { name: 'member' } });
      reply.code(201).send({ success: true, data: { user: safeUser, accessToken, refreshToken, expiresAt } });
    } catch (err: any) {
      if (err && err.name === 'ZodError') {
        app.log.warn('Auth registration validation failed', err);
        return reply.code(400).send({ success: false, error: { code: 'INVALID_INPUT', message: err.errors ? JSON.stringify(err.errors) : 'Invalid input' } });
      }
      if (err.message === 'EMAIL_EXISTS') {
        app.log.warn({ email: (request.body as any)?.email }, 'Auth registration duplicate email');
        return reply.code(409).send({ success: false, error: { code: 'EMAIL_EXISTS', message: 'Email already registered' } });
      }
      app.log.error(err, 'Auth registration failed');
      return reply.code(500).send({ success: false, error: { message: 'Internal server error' } });
    }
  });

  app.post('/auth/login', async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body);
      const user = await service.login(body.email, body.password);
      const { accessToken, refreshToken, expiresAt } = await service.createSessionAndTokens(user, {
        ip: request.ip,
        userAgent: request.headers['user-agent'] as string | undefined,
      });
      const safeUser = sanitizeUser(user);
      return reply.send({ success: true, data: { user: safeUser, accessToken, refreshToken, expiresAt } });
    } catch (err: any) {
      if (err && err.name === 'ZodError') {
        app.log.warn('Auth login validation failed', err);
        return reply.code(400).send({ success: false, error: { code: 'INVALID_INPUT', message: err.errors ? JSON.stringify(err.errors) : 'Invalid input' } });
      }
      if (err && err.message === 'INVALID_CREDENTIALS') {
        app.log.warn({ email: (request.body as any)?.email }, 'Auth login invalid credentials');
        return reply.code(401).send({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
      }
      app.log.error(err, 'Auth login failed');
      return reply.code(500).send({ success: false, error: { message: 'Internal server error' } });
    }
  });

  app.post('/auth/refresh', async (request, reply) => {
    try {
      const body = refreshSchema.parse(request.body);
      const payload = await service.verifyRefreshToken(body.refreshToken);
      const user = await prisma.user.findUnique({ where: { id: payload.userId }, include: { role: true } });
      if (!user) {
        app.log.warn({ userId: payload.userId }, 'Auth refresh user not found');
        return reply.code(401).send({ success: false, error: { message: 'Invalid token' } });
      }
      await service.revokeSession(payload.sessionId);
      const { accessToken, refreshToken, expiresAt } = await service.createSessionAndTokens(user, {
        ip: request.ip,
        userAgent: request.headers['user-agent'] as string | undefined,
      });
      const safeUser = sanitizeUser(user);
      reply.send({ success: true, data: { user: safeUser, accessToken, refreshToken, expiresAt } });
    } catch (err: any) {
      app.log.warn('Auth refresh failed', err);
      return reply.code(401).send({ success: false, error: { message: 'Invalid refresh token' } });
    }
  });

  app.post('/auth/logout', async (request, reply) => {
    try {
      const body = (request.body || {}) as any;
      const token = body.refreshToken || request.headers['x-refresh-token'];
      if (!token) return reply.code(204).send();
      const payload = await service.verifyRefreshToken(token);
      await service.revokeSession(payload.sessionId);
      reply.code(204).send();
    } catch (err: any) {
      app.log.warn('Auth logout failed or token invalid', err);
      reply.code(204).send();
    }
  });
}

export default registerAuthRoutes;
