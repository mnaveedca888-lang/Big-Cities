import type { FastifyCorsOptions } from '@fastify/cors';

export const PRODUCTION_FRONTEND_ORIGIN = 'https://rough-darkness-07cc.mnaveedca888.workers.dev';
export const DEVELOPMENT_FRONTEND_ORIGIN = 'http://localhost:5173';
export const LOCAL_FRONTEND_ORIGIN = 'http://127.0.0.1:8787';
export const STAGING_CANDIDATE_FRONTEND_ORIGIN = 'https://015a9521-rough-darkness-07cc.mnaveedca888.workers.dev';

export function getCorsOptions(nodeEnv = process.env.NODE_ENV): FastifyCorsOptions {
  const allowedOrigins = new Set([
    PRODUCTION_FRONTEND_ORIGIN,
    ...(nodeEnv === 'production' ? [] : [DEVELOPMENT_FRONTEND_ORIGIN, LOCAL_FRONTEND_ORIGIN]),
    ...(process.env.ENABLE_STAGING_CANDIDATE_CORS === 'true' ? [STAGING_CANDIDATE_FRONTEND_ORIGIN] : []),
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
