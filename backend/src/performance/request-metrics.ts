import { AsyncLocalStorage } from 'node:async_hooks';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { PrismaClient } from '@prisma/client';

interface RequestMetrics {
  startedAt: bigint;
  serializationStartedAt?: bigint;
  prismaCallCount: number;
  prismaRoundTripMs: number;
  serializationMs?: number;
  responseBytes?: number;
}

const requestMetrics = new AsyncLocalStorage<RequestMetrics>();

function isPerformanceRequest(request: FastifyRequest) {
  if (request.method !== 'GET') return false;

  const path = request.url.split('?')[0];
  return path === '/events'
    || path.startsWith('/events/')
    || path === '/countries'
    || path.startsWith('/countries/')
    || path === '/cities'
    || path.startsWith('/cities/');
}

function durationMs(startedAt: bigint, finishedAt = process.hrtime.bigint()) {
  return Number(finishedAt - startedAt) / 1_000_000;
}

function formatDuration(value: number) {
  return Math.max(0, value).toFixed(1);
}

export function instrumentPrismaPerformance(prisma: PrismaClient) {
  prisma.$use(async (_params, next) => {
    const metrics = requestMetrics.getStore();
    if (!metrics) return next(_params);

    const startedAt = process.hrtime.bigint();
    try {
      return await next(_params);
    } finally {
      metrics.prismaCallCount += 1;
      metrics.prismaRoundTripMs += durationMs(startedAt);
    }
  });
}

export function registerRequestPerformanceMetrics(app: FastifyInstance) {
  app.addHook('onRequest', (request, _reply, done) => {
    if (!isPerformanceRequest(request)) {
      done();
      return;
    }

    requestMetrics.run({
      startedAt: process.hrtime.bigint(),
      prismaCallCount: 0,
      prismaRoundTripMs: 0,
    }, done);
  });

  app.addHook('preSerialization', async (request, _reply, payload) => {
    const metrics = requestMetrics.getStore();
    if (metrics) metrics.serializationStartedAt = process.hrtime.bigint();
    return payload;
  });

  app.addHook('onSend', async (request, reply, payload) => {
    const metrics = requestMetrics.getStore();
    if (!metrics) return payload;

    const responseStartedAt = process.hrtime.bigint();
    if (metrics.serializationStartedAt) {
      metrics.serializationMs = durationMs(metrics.serializationStartedAt, responseStartedAt);
    }
    if (typeof payload === 'string') {
      metrics.responseBytes = Buffer.byteLength(payload);
    } else if (Buffer.isBuffer(payload)) {
      metrics.responseBytes = payload.byteLength;
    }

    reply.header('Server-Timing', [
      `request;dur=${formatDuration(durationMs(metrics.startedAt, responseStartedAt))}`,
      `prisma;dur=${formatDuration(metrics.prismaRoundTripMs)}`,
      ...(metrics.serializationMs === undefined
        ? []
        : [`serialize;dur=${formatDuration(metrics.serializationMs)}`]),
    ].join(', '));
    return payload;
  });

  app.addHook('onResponse', async (request, reply) => {
    const metrics = requestMetrics.getStore();
    if (!metrics) return;

    const route = request.routeOptions.url ?? request.url.split('?')[0];
    app.log.info({
      event: 'api.performance',
      method: request.method,
      route,
      statusCode: reply.statusCode,
      durationMs: Number(formatDuration(durationMs(metrics.startedAt))),
      prismaCallCount: metrics.prismaCallCount,
      prismaRoundTripMs: Number(formatDuration(metrics.prismaRoundTripMs)),
      serializationMs: metrics.serializationMs === undefined
        ? null
        : Number(formatDuration(metrics.serializationMs)),
      responseBytes: metrics.responseBytes ?? null,
    }, 'API request performance');
  });
}
