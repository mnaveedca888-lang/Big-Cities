import type { FastifyInstance } from 'fastify';

type ReadinessDatabase = {
  $queryRaw: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;
};

export function registerHealthRoutes(app: FastifyInstance, prisma: ReadinessDatabase) {
  app.get('/health/live', async () => ({ status: 'ok' }));
  app.get('/health/ready', async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ready' };
    } catch (err) {
      app.log.error('DB readiness check failed', err as any);
      return reply.code(503).send({ status: 'not_ready' });
    }
  });
}
