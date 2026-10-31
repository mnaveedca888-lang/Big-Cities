import Fastify from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendApiError } from './api-error';

describe('API error response mapping', () => {
  const apps: Array<ReturnType<typeof Fastify>> = [];

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
  });

  async function requestFor(error: unknown) {
    const app = Fastify();
    apps.push(app);
    app.get('/', async (_request, reply) => sendApiError(reply, app.log, error, 'test request failed'));
    await app.ready();
    return app.inject({ method: 'GET', url: '/' });
  }

  it('returns 500 and a safe message for unexpected database errors', async () => {
    const response = await requestFor(new Error('database connection string must not leak'));

    expect(response.statusCode).toBe(500);
    expect(response.json()).toMatchObject({ error: { message: 'Internal server error.' } });
    expect(response.body).not.toContain('connection string');
  });

  it('maps Prisma uniqueness and missing-record errors to appropriate statuses', async () => {
    const conflict = await requestFor(Object.assign(new Error('unique constraint'), { code: 'P2002' }));
    const missing = await requestFor(Object.assign(new Error('missing row'), { code: 'P2025' }));

    expect(conflict.statusCode).toBe(409);
    expect(missing.statusCode).toBe(404);
  });
});
