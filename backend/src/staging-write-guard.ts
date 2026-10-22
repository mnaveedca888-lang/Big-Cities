import type { FastifyInstance } from 'fastify';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const databaseWritesEnabled = () => process.env.DATABASE_WRITES_ENABLED === 'true';

export function registerStagingWriteGuard(app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    if (databaseWritesEnabled() || !WRITE_METHODS.has(request.method)) return;
    if (request.method === 'POST' && request.routeOptions.url === '/auth/login') return;

    return reply.code(503).send({
      success: false,
      error: { code: 'STAGING_READ_ONLY', message: 'Database writes are disabled.' },
    });
  });
}