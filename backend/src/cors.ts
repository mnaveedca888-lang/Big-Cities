import type { FastifyCorsOptions } from '@fastify/cors';

export const PRODUCTION_FRONTEND_ORIGIN = 'https://rough-darkness-07cc.mnaveedca888.workers.dev';
export const DEVELOPMENT_FRONTEND_ORIGIN = 'http://localhost:5173';

export function getCorsOptions(nodeEnv = process.env.NODE_ENV): FastifyCorsOptions {
  const allowedOrigins = new Set([
    PRODUCTION_FRONTEND_ORIGIN,
    ...(nodeEnv === 'production' ? [] : [DEVELOPMENT_FRONTEND_ORIGIN]),
  ]);

  return {
    origin: (origin, callback) => {
      if (origin && allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  };
}
