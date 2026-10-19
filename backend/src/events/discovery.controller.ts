import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import AuthService from '../auth/auth.service';
import { DAILY_EVENT_CATEGORIES, discoverAndStoreEvents } from './discovery.service';
import { databaseWritesEnabled } from '../staging-write-guard';

const querySchema = z.object({
  country: z.string().trim().min(2),
  countryCode: z.string().trim().min(2).max(3),
  category: z.enum(DAILY_EVENT_CATEGORIES),
});

export function registerEventDiscoveryRoutes(app: FastifyInstance, prisma: PrismaClient) {
  const auth = new AuthService(prisma as any);
  const requestCounts = new Map<string, { startedAt: number; count: number }>();
  app.get('/events/discover', async (request, reply) => {
    if (!databaseWritesEnabled() || process.env.EVENT_DISCOVERY_ENABLED !== 'true') {
      return reply.code(403).send({ success: false, error: { message: 'Event discovery is disabled in staging.' } });
    }
    try {
      const authHeader = (request.headers.authorization || '') as string;
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
      const userId = token ? await auth.verifyAccessToken(token).catch(() => null) : null;
      const user = userId ? await prisma.user.findUnique({ where: { id: userId }, include: { role: true } }) : null;
      if (user?.role?.name !== 'admin') return reply.code(403).send({ success: false, error: { message: 'Forbidden' } });
      const ip = request.ip || 'unknown';
      const now = Date.now();
      const window = requestCounts.get(ip);
      if (!window || now - window.startedAt >= 10 * 60 * 1000) requestCounts.set(ip, { startedAt: now, count: 1 });
      else {
        window.count += 1;
        if (window.count > 20) return reply.code(429).send({ success: false, error: { message: 'Discovery rate limit exceeded.' } });
      }
      const query = querySchema.parse(request.query || {});
      const country = await prisma.country.findUnique({ where: { code: query.countryCode.toUpperCase() }, select: { code: true, name: true } });
      if (!country || country.name.toLowerCase() !== query.country.toLowerCase()) return reply.code(400).send({ success: false, error: { message: 'Unknown country.' } });
      const result = await discoverAndStoreEvents(prisma, country, query.category);
      return reply.send({ success: true, data: result.events });
    } catch (error) {
      app.log.warn({ error }, 'AI event discovery failed');
      return reply.code(503).send({ success: false, error: { message: 'AI event discovery is currently unavailable.' } });
    }
  });
}