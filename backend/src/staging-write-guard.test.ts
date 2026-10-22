import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registerStagingWriteGuard } from './staging-write-guard';

describe('staging write guard', () => {
  const previousFlag = process.env.DATABASE_WRITES_ENABLED;
  let app: ReturnType<typeof Fastify>;
  const writeHandler = vi.fn(async () => ({ written: true }));

  beforeEach(async () => {
    process.env.DATABASE_WRITES_ENABLED = 'false';
    writeHandler.mockClear();
    app = Fastify();
    registerStagingWriteGuard(app);
    app.post('/write', writeHandler);
    app.post('/auth/login', writeHandler);
    app.patch('/write', writeHandler);
    app.delete('/write', writeHandler);
    app.get('/health/live', async () => ({ status: 'ok' }));
    app.get('/read', async () => ({ data: [] }));
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    if (previousFlag === undefined) delete process.env.DATABASE_WRITES_ENABLED;
    else process.env.DATABASE_WRITES_ENABLED = previousFlag;
  });

  it.each(['POST', 'PATCH', 'DELETE'])('blocks %s before its handler runs', async (method) => {
    const response = await app.inject({ method: method as any, url: '/write' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ error: { code: 'STAGING_READ_ONLY' } });
    expect(writeHandler).not.toHaveBeenCalled();
  });

  it('allows the login handler while staging writes remain disabled', async () => {
    const response = await app.inject({ method: 'POST', url: '/auth/login' });

    expect(response.statusCode).toBe(200);
    expect(writeHandler).toHaveBeenCalledOnce();
  });

  it('leaves health and read-only GET requests available', async () => {
    const health = await app.inject({ method: 'GET', url: '/health/live' });
    const read = await app.inject({ method: 'GET', url: '/read' });

    expect(health.statusCode).toBe(200);
    expect(read.statusCode).toBe(200);
    expect(writeHandler).not.toHaveBeenCalled();
  });
});