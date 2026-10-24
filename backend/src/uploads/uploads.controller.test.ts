import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import registerUploadRoutes from './uploads.controller';

describe('admin image upload validation', () => {
  const envKeys = ['DATABASE_WRITES_ENABLED', 'UPLOADS_ENABLED', 'JWT_ACCESS_TOKEN_SECRET'] as const;
  const originalEnv = new Map<string, string | undefined>();
  let app: ReturnType<typeof Fastify>;
  let uploadCreate: ReturnType<typeof vi.fn>;
  let mkdirSpy: ReturnType<typeof vi.spyOn>;
  let writeFileSpy: ReturnType<typeof vi.spyOn>;
  let authorization: string;

  beforeEach(async () => {
    for (const key of envKeys) originalEnv.set(key, process.env[key]);
    process.env.DATABASE_WRITES_ENABLED = 'true';
    process.env.UPLOADS_ENABLED = 'true';
    process.env.JWT_ACCESS_TOKEN_SECRET = 'test-upload-secret';
    authorization = `Bearer ${jwt.sign({ sub: 'admin-user' }, process.env.JWT_ACCESS_TOKEN_SECRET)}`;
    uploadCreate = vi.fn().mockResolvedValue({});
    mkdirSpy = vi.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined as any);
    writeFileSpy = vi.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'admin-user', role: { name: 'admin' } }) },
      upload: { create: uploadCreate },
    } as any;
    app = Fastify();
    await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
    registerUploadRoutes(app, prisma);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    mkdirSpy.mockRestore();
    writeFileSpy.mockRestore();
    for (const key of envKeys) {
      const value = originalEnv.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  function imageRequest(bytes: Buffer, filename = 'upload.png', contentType = 'image/png') {
    const boundary = 'BigCitiesUploadBoundary';
    const payload = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`),
      bytes,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
    return app.inject({
      method: 'POST',
      url: '/uploads/files',
      headers: {
        authorization,
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      payload,
    });
  }

  it('rejects files whose bytes do not match an allowed image MIME type', async () => {
    const response = await imageRequest(Buffer.from('not an image'));

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: { message: 'Image content does not match its content type.' } });
    expect(uploadCreate).not.toHaveBeenCalled();
    expect(mkdirSpy).not.toHaveBeenCalled();
    expect(writeFileSpy).not.toHaveBeenCalled();
  });

  it('stores an image only after MIME, extension, and signature validation', async () => {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const response = await imageRequest(pngHeader);

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toHaveLength(1);
    expect(uploadCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: 'admin-user', type: 'image/png', size: pngHeader.length }),
    }));
    expect(mkdirSpy).toHaveBeenCalledOnce();
    expect(writeFileSpy).toHaveBeenCalledOnce();
  });
});
