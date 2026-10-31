import Fastify from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AuthService from '../auth/auth.service';
import { registerUploadRoutes } from './uploads.controller';

describe('previous image deletion route authorization', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects unauthenticated and non-admin catalog image deletion requests', async () => {
    vi.spyOn(AuthService.prototype, 'verifyAccessToken').mockResolvedValue('member-user');
    const prisma = {
      user: {
        findUnique: vi.fn(async () => ({ role: { name: 'member' } })),
      },
    } as any;
    const app = Fastify();
    registerUploadRoutes(app, prisma);

    const body = {
      entity: 'country',
      entityId: 'AL',
      field: 'heroImageUrl',
      previousUrl: '/images/uploads/member-user/uploads/1000-old.png',
      replacementUrl: '/images/uploads/member-user/uploads/2000-new.png',
    };
    const unauthenticated = await app.inject({
      method: 'POST',
      url: '/uploads/replacements/delete',
      payload: body,
    });
    const nonAdmin = await app.inject({
      method: 'POST',
      url: '/uploads/replacements/delete',
      headers: { authorization: 'Bearer test-token' },
      payload: body,
    });

    expect(unauthenticated.statusCode).toBe(401);
    expect(nonAdmin.statusCode).toBe(403);
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
    await app.close();
  });
});
