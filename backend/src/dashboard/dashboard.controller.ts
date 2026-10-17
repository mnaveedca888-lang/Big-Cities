import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import AuthService from '../auth/auth.service';

function getBearerToken(request: any) {
  const authHeader = (request.headers.authorization || '') as string;
  return authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
}

export function registerDashboardRoutes(app: FastifyInstance, prisma: PrismaClient) {
  const auth = new AuthService(prisma as any);

  const buildPayload = async (userId: string) => {
    const [totalUsers, totalEvents, upcomingEvents, savedEvents, notifications, recentEvents, recentActivity] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.event.count({ where: { startAt: { gte: new Date() } } }),
      prisma.savedEvent.count({ where: { userId } }),
      prisma.notification.count({ where: { userId } }),
      prisma.event.findMany({
        where: { startAt: { gte: new Date() } },
        orderBy: { startAt: 'asc' },
        take: 5,
        select: {
          id: true,
          slug: true,
          title: true,
          startAt: true,
          countryCode: true,
          citySlug: true,
        },
      }),
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      totalUsers,
      totalEvents,
      upcomingEvents,
      savedEvents,
      notifications,
      recentEvents: recentEvents.map((event) => ({
        id: event.id,
        slug: event.slug,
        title: event.title,
        startAt: event.startAt.toISOString(),
        countryCode: event.countryCode,
        citySlug: event.citySlug,
      })),
      watchlist: savedEvents,
      recentActivity: recentActivity.map((activity) => ({
        id: activity.id,
        label: activity.title,
        createdAt: activity.createdAt.toISOString(),
      })),
    };
  };

  const handleDashboardRequest = async (request: any, reply: any, requireAdmin = false) => {
    const token = getBearerToken(request);
    if (!token) {
      return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
    }

    let userId: string;
    try {
      userId = await auth.verifyAccessToken(token);
    } catch {
      return reply.code(401).send({ success: false, error: { message: 'Invalid token' } });
    }

    if (requireAdmin) {
      const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
      if (!user || user.role?.name !== 'admin') {
        return reply.code(403).send({ success: false, error: { message: 'Forbidden' } });
      }
    }

    const data = await buildPayload(userId);
    return reply.send({ success: true, data });
  };

  app.get('/dashboard', async (request, reply) => handleDashboardRequest(request, reply, true));
  app.get('/dashboard/overview', async (request, reply) => handleDashboardRequest(request, reply, true));
  app.get('/dashboard/stats', async (request, reply) => handleDashboardRequest(request, reply, true));
  app.get('/admin/dashboard', async (request, reply) => handleDashboardRequest(request, reply, true));
}

export default registerDashboardRoutes;
