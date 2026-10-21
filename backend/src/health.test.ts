import Fastify from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerHealthRoutes } from './health';

const apps: ReturnType<typeof Fastify>[] = [];

function createHealthApp(queryRaw: ReturnType<typeof vi.fn>) {
  const app = Fastify({ logger: false });
  apps.push(app);
  registerHealthRoutes(app, { $queryRaw: queryRaw } as any);
  return app;
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('health routes', () => {
  it('keeps liveness successful without checking database availability', async () => {
    const queryRaw = vi.fn().mockRejectedValue(new Error('database unavailable'));
    const app = createHealthApp(queryRaw);

    const response = await app.inject({ method: 'GET', url: '/health/live' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it('returns ready only when the database query succeeds', async () => {
    const queryRaw = vi.fn().mockResolvedValue([{ result: 1 }]);
    const app = createHealthApp(queryRaw);

    const response = await app.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ready' });
    expect(queryRaw).toHaveBeenCalledOnce();
  });

  it('returns HTTP 503 when the database query fails', async () => {
    const queryRaw = vi.fn().mockRejectedValue(new Error('database unavailable'));
    const app = createHealthApp(queryRaw);

    const response = await app.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ status: 'not_ready' });
    expect(queryRaw).toHaveBeenCalledOnce();
  });
});
