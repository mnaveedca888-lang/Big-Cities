import Fastify from 'fastify';
import type { Prisma, PrismaClient } from '@prisma/client';
import { Writable } from 'node:stream';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { instrumentPrismaPerformance, registerRequestPerformanceMetrics } from './request-metrics';

describe('request performance metrics', () => {
  let app: ReturnType<typeof Fastify>;

  it('reports request, Prisma, serialization, and response size without logging SQL or query values', async () => {
    const logLines: string[] = [];
    const logStream = new Writable({
      write(chunk, _encoding, callback) {
        logLines.push(chunk.toString());
        callback();
      },
    });
    app = Fastify({
      disableRequestLogging: true,
      logger: { level: 'info', stream: logStream },
    });
    let middleware: Prisma.Middleware | undefined;
    const prisma = {
      $use: vi.fn((value: Prisma.Middleware) => {
        middleware = value;
      }),
    } as unknown as PrismaClient;
    instrumentPrismaPerformance(prisma);
    registerRequestPerformanceMetrics(app);
    app.get('/events', async () => {
      await middleware!({
        model: 'Event',
        action: 'findMany',
        args: { where: { title: 'private-query-value' } },
        dataPath: [],
        runInTransaction: false,
      }, async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return [];
      });
      return { success: true, data: [] };
    });

    const response = await app.inject({ method: 'GET', url: '/events?secretQuery=must-not-be-logged' });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.headers['server-timing']).toMatch(/request;dur=/);
    expect(response.headers['server-timing']).toMatch(/prisma;dur=/);
    expect(response.headers['server-timing']).toMatch(/serialize;dur=/);
    const performanceLogs = logLines.filter((line) => line.includes('"event":"api.performance"'));
    expect(performanceLogs).toHaveLength(1);
    expect(performanceLogs[0]).toContain('"route":"/events"');
    expect(performanceLogs[0]).toContain('"prismaCallCount":1');
    expect(performanceLogs[0]).toContain('"responseBytes":');
    expect(logLines.join('')).not.toContain('private-query-value');
    expect(logLines.join('')).not.toContain('secretQuery');
  });

  it('keeps Prisma measurements isolated between concurrent requests', async () => {
    const logLines: string[] = [];
    const logStream = new Writable({
      write(chunk, _encoding, callback) {
        logLines.push(chunk.toString());
        callback();
      },
    });
    app = Fastify({
      disableRequestLogging: true,
      logger: { level: 'info', stream: logStream },
    });
    let middleware: Prisma.Middleware | undefined;
    const prisma = {
      $use: vi.fn((value: Prisma.Middleware) => {
        middleware = value;
      }),
    } as unknown as PrismaClient;
    instrumentPrismaPerformance(prisma);

    const addRoute = (route: string, delayMs: number) => {
      app.get(route, async () => {
        await middleware!({
          model: 'Event',
          action: 'findMany',
          args: {},
          dataPath: [],
          runInTransaction: false,
        }, async () => {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          return [];
        });
        return { success: true };
      });
    };
    addRoute('/events', 20);
    addRoute('/countries/PK', 5);
    registerRequestPerformanceMetrics(app);

    await Promise.all([
      app.inject({ method: 'GET', url: '/events' }),
      app.inject({ method: 'GET', url: '/countries/PK' }),
    ]);
    await app.close();

    const metrics = logLines
      .filter((line) => line.includes('"event":"api.performance"'))
      .map((line) => JSON.parse(line));
    expect(metrics).toHaveLength(2);
    expect(metrics.map(({ route }) => route).sort()).toEqual(['/countries/PK', '/events']);
    expect(metrics.every(({ prismaCallCount }) => prismaCallCount === 1)).toBe(true);
    expect(metrics.every(({ prismaRoundTripMs }) => prismaRoundTripMs > 0)).toBe(true);
  });
});
