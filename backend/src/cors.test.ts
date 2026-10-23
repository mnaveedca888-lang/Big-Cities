import Fastify from 'fastify';
import cors from '@fastify/cors';
import { afterEach, describe, expect, it } from 'vitest';
import {
  DEVELOPMENT_FRONTEND_ORIGIN,
  getCorsOptions,
  PRODUCTION_FRONTEND_ORIGIN,
  STAGING_CANDIDATE_FRONTEND_ORIGIN,
  STAGING_PREVIEW_FRONTEND_ORIGIN,
} from './cors';

const apps: ReturnType<typeof Fastify>[] = [];

async function createCorsApp(nodeEnv: string) {
  const app = Fastify();
  apps.push(app);
  await app.register(cors, getCorsOptions(nodeEnv));
  app.get('/health/live', async () => ({ status: 'ok' }));
  await app.ready();
  return app;
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('CORS configuration', () => {
  it('allows only exact staging candidate origins when the staging flag is enabled', async () => {
    const previousFlag = process.env.ENABLE_STAGING_CANDIDATE_CORS;
    try {
      process.env.ENABLE_STAGING_CANDIDATE_CORS = 'true';
      const enabledApp = await createCorsApp('production');
      for (const origin of [STAGING_CANDIDATE_FRONTEND_ORIGIN, STAGING_PREVIEW_FRONTEND_ORIGIN]) {
        const response = await enabledApp.inject({
          method: 'OPTIONS',
          url: '/auth/login',
          headers: {
            origin,
            'access-control-request-method': 'POST',
            'access-control-request-headers': 'content-type',
          },
        });

        expect(response.statusCode).toBe(204);
        expect(response.headers['access-control-allow-origin']).toBe(origin);
        expect(response.headers['access-control-allow-methods']).toContain('POST');
      }

      process.env.ENABLE_STAGING_CANDIDATE_CORS = 'false';
      const disabledApp = await createCorsApp('production');
      for (const origin of [STAGING_CANDIDATE_FRONTEND_ORIGIN, STAGING_PREVIEW_FRONTEND_ORIGIN]) {
        const response = await disabledApp.inject({
          method: 'OPTIONS',
          url: '/auth/login',
          headers: {
            origin,
            'access-control-request-method': 'POST',
            'access-control-request-headers': 'content-type',
          },
        });

        expect(response.statusCode).toBe(404);
        expect(response.headers['access-control-allow-origin']).toBeUndefined();
      }

      process.env.ENABLE_STAGING_CANDIDATE_CORS = 'true';
      const unrelatedResponse = await enabledApp.inject({
        method: 'OPTIONS',
        url: '/auth/login',
        headers: {
          origin: 'https://unrelated-preview.workers.dev',
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'content-type',
        },
      });
      expect(unrelatedResponse.statusCode).toBe(404);
      expect(unrelatedResponse.headers['access-control-allow-origin']).toBeUndefined();
    } finally {
      if (previousFlag === undefined) delete process.env.ENABLE_STAGING_CANDIDATE_CORS;
      else process.env.ENABLE_STAGING_CANDIDATE_CORS = previousFlag;
    }
  });

  it('allows the approved production frontend origin', async () => {
    const app = await createCorsApp('production');
    const response = await app.inject({
      method: 'GET',
      url: '/health/live',
      headers: { origin: PRODUCTION_FRONTEND_ORIGIN },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe(PRODUCTION_FRONTEND_ORIGIN);
  });

  it('does not grant CORS access to unrelated origins', async () => {
    const app = await createCorsApp('production');
    const response = await app.inject({
      method: 'GET',
      url: '/health/live',
      headers: { origin: 'https://unrelated.example' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows localhost only outside production', async () => {
    const developmentApp = await createCorsApp('development');
    const developmentResponse = await developmentApp.inject({
      method: 'GET',
      url: '/health/live',
      headers: { origin: DEVELOPMENT_FRONTEND_ORIGIN },
    });
    expect(developmentResponse.headers['access-control-allow-origin']).toBe(DEVELOPMENT_FRONTEND_ORIGIN);

    const productionApp = await createCorsApp('production');
    const productionResponse = await productionApp.inject({
      method: 'GET',
      url: '/health/live',
      headers: { origin: DEVELOPMENT_FRONTEND_ORIGIN },
    });
    expect(productionResponse.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('serves requests without an Origin header without adding CORS headers', async () => {
    const app = await createCorsApp('production');
    const response = await app.inject({ method: 'GET', url: '/health/live' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows Authorization preflight requests from the approved frontend', async () => {
    const app = await createCorsApp('production');
    const response = await app.inject({
      method: 'OPTIONS',
      url: '/health/live',
      headers: {
        origin: PRODUCTION_FRONTEND_ORIGIN,
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'authorization,content-type',
      },
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe(PRODUCTION_FRONTEND_ORIGIN);
    expect(response.headers['access-control-allow-headers']).toBe('Authorization, Content-Type');
    expect(response.headers['access-control-allow-methods'])
      .toBe('GET, HEAD, POST, PATCH, DELETE');
  });
});
