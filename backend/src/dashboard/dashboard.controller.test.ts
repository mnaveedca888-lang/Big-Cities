import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AuthService from '../auth/auth.service';
import { registerDashboardRoutes } from './dashboard.controller';

function createPrisma(role: string) {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue({ role: { name: role } }),
      count: vi.fn().mockResolvedValue(4),
    },
    event: {
      count: vi.fn().mockResolvedValue(8),
      findMany: vi.fn().mockResolvedValue([]),
    },
    savedEvent: { count: vi.fn().mockResolvedValue(0) },
    notification: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
    },
  };
}

async function createApp(role: string) {
  const prisma = createPrisma(role);
  const app = Fastify();
  registerDashboardRoutes(app, prisma as any);
  await app.ready();
  const auth = new AuthService(prisma as any);
  return { app, prisma, token: auth.signAccessToken(`${role}-id`) };
}

describe('dashboard API authorization', () => {
  beforeEach(() => {
    vi.stubEnv('JWT_ACCESS_TOKEN_SECRET', 'dashboard-controller-test-secret');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('requires authentication for direct dashboard API requests', async () => {
    const { app } = await createApp('admin');
    const response = await app.inject({ method: 'GET', url: '/dashboard/overview' });
    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it('denies non-admin roles the dashboard data endpoints', async () => {
    const { app, prisma, token } = await createApp('user');
    for (const url of ['/dashboard', '/dashboard/overview', '/dashboard/stats', '/admin/dashboard']) {
      const response = await app.inject({ method: 'GET', url, headers: { authorization: `Bearer ${token}` } });
      expect(response.statusCode, url).toBe(403);
    }
    expect(prisma.user.count).not.toHaveBeenCalled();
    expect(prisma.event.count).not.toHaveBeenCalled();
    await app.close();
  });

  it('keeps dashboard API access available to administrators', async () => {
    const { app, token } = await createApp('admin');
    const response = await app.inject({ method: 'GET', url: '/dashboard/overview', headers: { authorization: `Bearer ${token}` } });
    expect(response.statusCode).toBe(200);
    expect(response.json().data.totalUsers).toBe(4);
    await app.close();
  });
});
