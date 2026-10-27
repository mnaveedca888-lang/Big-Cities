import Fastify from 'fastify';
import cors from '@fastify/cors';
import { afterEach, describe, expect, it } from 'vitest';
import {
  DEVELOPMENT_FRONTEND_ORIGIN,
  getCorsOptions,
  PRODUCTION_FRONTEND_ORIGIN,
  STAGING_CANDIDATE_FRONTEND_ORIGIN,
} from './cors';

const apps: ReturnType<typeof Fastify>[] = [];

async function createCorsApp(nodeEnv: string) {
  const app = Fastify();
  apps.push(app);
  await app.register(cors, getCorsOptions(nodeEnv));
  app.get('/health/live', async () => ({ status: 'ok' }));
  app.get('/continents', async () => ({ success: true, data: [] }));
  app.get('/countries', async () => ({ success: true, data: [] }));
  app.post('/auth/login', async (request, reply) => {
    if (!request.body || typeof request.body !== 'object') {
      return reply.code(400).send({ success: false, error: 'Invalid request' });
    }
    return reply.code(401).send({ success: false, error: 'Invalid credentials' });
  });
  app.get('/failure', async () => {
    throw new Error('Expected test failure');
  });
  await app.ready();
  return app;
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('CORS configuration', () => {
  it('allows the exact candidate origin when staging candidate CORS is enabled', async () => {
    const previousValue = process.env.ENABLE_STAGING_CANDIDATE_CORS;
    process.env.ENABLE_STAGING_CANDIDATE_CORS = 'true';
    const app = await createCorsApp('production');

    try {
      for (const url of ['/continents', '/countries?page=1&perPage=12&sort=name']) {
        const response = await app.inject({
          method: 'GET',
          url,
          headers: { origin: STAGING_CANDIDATE_FRONTEND_ORIGIN },
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers['access-control-allow-origin']).toBe(STAGING_CANDIDATE_FRONTEND_ORIGIN);
      }
    } finally {
      if (previousValue === undefined) delete process.env.ENABLE_STAGING_CANDIDATE_CORS;
      else process.env.ENABLE_STAGING_CANDIDATE_CORS = previousValue;
    }
  });

  it('does not allow the candidate origin when staging candidate CORS is unset', async () => {
    const previousValue = process.env.ENABLE_STAGING_CANDIDATE_CORS;
    delete process.env.ENABLE_STAGING_CANDIDATE_CORS;
    const app = await createCorsApp('production');

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/continents',
        headers: { origin: STAGING_CANDIDATE_FRONTEND_ORIGIN },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    } finally {
      if (previousValue === undefined) delete process.env.ENABLE_STAGING_CANDIDATE_CORS;
      else process.env.ENABLE_STAGING_CANDIDATE_CORS = previousValue;
    }
  });

  it('handles candidate preflights for catalog GET and auth POST routes', async () => {
    const previousValue = process.env.ENABLE_STAGING_CANDIDATE_CORS;
    process.env.ENABLE_STAGING_CANDIDATE_CORS = 'true';
    const app = await createCorsApp('production');

    try {
      for (const [url, method] of [
        ['/continents', 'GET'],
        ['/countries?page=1&perPage=12&sort=name', 'GET'],
        ['/auth/login', 'POST'],
      ]) {
        const response = await app.inject({
          method: 'OPTIONS',
          url,
          headers: {
            origin: STAGING_CANDIDATE_FRONTEND_ORIGIN,
            'access-control-request-method': method,
            'access-control-request-headers': 'authorization,content-type',
          },
        });

        expect(response.statusCode).toBe(204);
        expect(response.headers['access-control-allow-origin']).toBe(STAGING_CANDIDATE_FRONTEND_ORIGIN);
        expect(response.headers['access-control-allow-headers']).toBe('Authorization, Content-Type');
        expect(response.headers['access-control-allow-methods']).toContain(method);
        expect(response.headers['access-control-allow-credentials']).toBeUndefined();
      }
    } finally {
      if (previousValue === undefined) delete process.env.ENABLE_STAGING_CANDIDATE_CORS;
      else process.env.ENABLE_STAGING_CANDIDATE_CORS = previousValue;
    }
  });

  it('keeps candidate CORS headers on login and server error responses', async () => {
    const previousValue = process.env.ENABLE_STAGING_CANDIDATE_CORS;
    process.env.ENABLE_STAGING_CANDIDATE_CORS = 'true';
    const app = await createCorsApp('production');

    try {
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        headers: {
          origin: STAGING_CANDIDATE_FRONTEND_ORIGIN,
          'content-type': 'application/json',
        },
        payload: {},
      });
      expect(loginResponse.statusCode).toBe(401);
      expect(loginResponse.headers['access-control-allow-origin']).toBe(STAGING_CANDIDATE_FRONTEND_ORIGIN);

      const errorResponse = await app.inject({
        method: 'GET',
        url: '/failure',
        headers: { origin: STAGING_CANDIDATE_FRONTEND_ORIGIN },
      });
      expect(errorResponse.statusCode).toBe(500);
      expect(errorResponse.headers['access-control-allow-origin']).toBe(STAGING_CANDIDATE_FRONTEND_ORIGIN);
    } finally {
      if (previousValue === undefined) delete process.env.ENABLE_STAGING_CANDIDATE_CORS;
      else process.env.ENABLE_STAGING_CANDIDATE_CORS = previousValue;
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
