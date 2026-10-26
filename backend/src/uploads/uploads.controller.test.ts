import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import staticPlugin from '@fastify/static';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { randomUUID } from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import registerUploadRoutes from './uploads.controller';
import { registerUploadImageRoutes, type UploadStorage } from './upload-storage';

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

  function imageRequest(bytes: Buffer, filename = 'upload.png', contentType = 'image/png', token: string | null = authorization) {
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
        ...(token ? { authorization: token } : {}),
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

  it('rejects missing or invalid admin credentials before storing a file', async () => {
    const missingToken = await imageRequest(Buffer.from('not read'), 'upload.png', 'image/png', null);
    const invalidToken = await imageRequest(Buffer.from('not read'), 'upload.png', 'image/png', 'Bearer invalid-token');

    expect(missingToken.statusCode).toBe(401);
    expect(invalidToken.statusCode).toBe(403);
    expect(uploadCreate).not.toHaveBeenCalled();
    expect(mkdirSpy).not.toHaveBeenCalled();
    expect(writeFileSpy).not.toHaveBeenCalled();
  });

  it('rejects mismatched extensions and files larger than 5 MB', async () => {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const mismatchedExtension = await imageRequest(pngHeader, 'upload.jpg');
    const oversized = await imageRequest(Buffer.alloc(5 * 1024 * 1024 + 1), 'large.png');

    expect(mismatchedExtension.statusCode).toBe(400);
    expect(mismatchedExtension.json()).toMatchObject({
      error: { message: 'Image file extension does not match its content type.' },
    });
    expect(oversized.statusCode).toBe(413);
    expect(oversized.json()).toMatchObject({
      error: { message: 'Image exceeds the 5 MB upload limit.' },
    });
    expect(uploadCreate).not.toHaveBeenCalled();
    expect(writeFileSpy).not.toHaveBeenCalled();
  });

  it('does not silently use ephemeral local storage for production uploads', async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousStorageDriver = process.env.UPLOAD_STORAGE_DRIVER;
    process.env.NODE_ENV = 'production';
    delete process.env.UPLOAD_STORAGE_DRIVER;
    try {
      const response = await imageRequest(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

      expect(response.statusCode).toBe(503);
      expect(response.json()).toMatchObject({
        error: { message: 'Image storage is not configured or is temporarily unavailable.' },
      });
      expect(uploadCreate).not.toHaveBeenCalled();
      expect(mkdirSpy).not.toHaveBeenCalled();
      expect(writeFileSpy).not.toHaveBeenCalled();
    } finally {
      if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousNodeEnv;
      if (previousStorageDriver === undefined) delete process.env.UPLOAD_STORAGE_DRIVER;
      else process.env.UPLOAD_STORAGE_DRIVER = previousStorageDriver;
    }
  });

  it('does not create a phantom upload record for the unsupported direct-upload endpoint', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/uploads/presign',
      headers: { authorization },
      payload: { filename: 'image.png', contentType: 'image/png' },
    });

    expect(response.statusCode).toBe(501);
    expect(response.json()).toMatchObject({ error: { message: expect.stringContaining('/uploads/files') } });
    expect(uploadCreate).not.toHaveBeenCalled();
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

describe('local image upload persistence', () => {
  it('keeps an uploaded image accessible after the Fastify server restarts', async () => {
    const userId = `dashboard-test-${randomUUID()}`;
    const uploadDir = path.resolve(__dirname, '../../public/Images/uploads', userId);
    const publicImages = path.resolve(__dirname, '../../public/Images');
    const imageBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const secret = 'test-upload-persistence-secret';
    const authorization = `Bearer ${jwt.sign({ sub: userId }, secret)}`;
    let app: ReturnType<typeof Fastify> | undefined;

    const previousEnv = {
      DATABASE_WRITES_ENABLED: process.env.DATABASE_WRITES_ENABLED,
      UPLOADS_ENABLED: process.env.UPLOADS_ENABLED,
      JWT_ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_TOKEN_SECRET,
    };
    process.env.DATABASE_WRITES_ENABLED = 'true';
    process.env.UPLOADS_ENABLED = 'true';
    process.env.JWT_ACCESS_TOKEN_SECRET = secret;

    const createApp = async () => {
      const server = Fastify();
      await server.register(multipart, { limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
      await server.register(staticPlugin, { root: publicImages, prefix: '/images/' });
      registerUploadRoutes(server, {
        user: { findUnique: vi.fn().mockResolvedValue({ id: userId, role: { name: 'admin' } }) },
        upload: { create: vi.fn().mockImplementation(({ data }: { data: unknown }) => Promise.resolve(data)) },
      } as any);
      await server.ready();
      return server;
    };

    try {
      expect(fs.existsSync(uploadDir)).toBe(false);
      app = await createApp();
      const boundary = 'BigCitiesPersistenceBoundary';
      const payload = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="restart-check.png"\r\nContent-Type: image/png\r\n\r\n`),
        imageBytes,
        Buffer.from(`\r\n--${boundary}--\r\n`),
      ]);
      const uploadResponse = await app.inject({
        method: 'POST',
        url: '/uploads/files',
        headers: { authorization, 'content-type': `multipart/form-data; boundary=${boundary}` },
        payload,
      });

      expect(uploadResponse.statusCode).toBe(200);
      const imageUrl = uploadResponse.json().data[0].url as string;
      const fileName = path.basename(imageUrl);
      expect(await fs.promises.readFile(path.join(uploadDir, fileName))).toEqual(imageBytes);
      await app.close();

      app = await createApp();
      const fileResponse = await app.inject({ method: 'GET', url: imageUrl });
      expect(fileResponse.statusCode).toBe(200);
      expect(fileResponse.rawPayload).toEqual(imageBytes);
    } finally {
      await app?.close();
      await fs.promises.rm(uploadDir, { recursive: true, force: true });
      for (const key of Object.keys(previousEnv) as Array<keyof typeof previousEnv>) {
        const value = previousEnv[key];
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
});

describe('persistent image upload storage', () => {
  it('serves the same uploaded image after the API server is recreated', async () => {
    const userId = `dashboard-test-${randomUUID()}`;
    const secret = 'test-upload-persistence-secret';
    const imageBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const storedObjects = new Map<string, { data: Buffer; contentType: string }>();
    const storage: UploadStorage = {
      driver: 's3',
      storeFile: vi.fn(async ({ userId: storageUserId, filename, contentType, buffer }) => {
        const fileKey = `${storageUserId}/${filename}`;
        storedObjects.set(fileKey, { data: buffer, contentType: contentType ?? 'application/octet-stream' });
        return { fileKey, url: `/images/uploads/${fileKey}`, size: buffer.length };
      }),
      readFile: vi.fn(async (fileKey) => {
        const image = storedObjects.get(fileKey);
        if (!image) throw new Error('Image not found');
        return { buffer: image.data, contentType: image.contentType };
      }),
      deleteFile: vi.fn(async (fileKey) => {
        storedObjects.delete(fileKey);
      }),
    };
    const authorization = `Bearer ${jwt.sign({ sub: userId }, secret)}`;
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ id: userId, role: { name: 'admin' } }) },
      upload: { create: vi.fn().mockResolvedValue({}) },
    } as any;
    const previousEnv = {
      DATABASE_WRITES_ENABLED: process.env.DATABASE_WRITES_ENABLED,
      UPLOADS_ENABLED: process.env.UPLOADS_ENABLED,
      JWT_ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_TOKEN_SECRET,
      UPLOAD_STORAGE_DRIVER: process.env.UPLOAD_STORAGE_DRIVER,
    };
    process.env.DATABASE_WRITES_ENABLED = 'true';
    process.env.UPLOADS_ENABLED = 'true';
    process.env.JWT_ACCESS_TOKEN_SECRET = secret;
    process.env.UPLOAD_STORAGE_DRIVER = 's3';

    const createApp = async () => {
      const server = Fastify();
      await server.register(multipart, { limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
      registerUploadImageRoutes(server, storage);
      await server.register(staticPlugin, { root: path.resolve(__dirname, '../../public/Images'), prefix: '/images/' });
      registerUploadRoutes(server, prisma as any, storage);
      await server.ready();
      return server;
    };

    let app: ReturnType<typeof Fastify> | undefined;
    try {
      app = await createApp();
      const boundary = 'BigCitiesObjectStorageBoundary';
      const payload = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="persistent.png"\r\nContent-Type: image/png\r\n\r\n`),
        imageBytes,
        Buffer.from(`\r\n--${boundary}--\r\n`),
      ]);
      const uploadResponse = await app.inject({
        method: 'POST',
        url: '/uploads/files',
        headers: { authorization, 'content-type': `multipart/form-data; boundary=${boundary}` },
        payload,
      });
      expect(uploadResponse.statusCode).toBe(200);
      const imageUrl = uploadResponse.json().data[0].url as string;
      expect(storedObjects.size).toBe(1);
      await app.close();

      app = await createApp();
      const imageResponse = await app.inject({ method: 'GET', url: imageUrl });
      expect(imageResponse.statusCode).toBe(200);
      expect(imageResponse.rawPayload).toEqual(imageBytes);
      expect(imageResponse.headers['content-type']).toContain('image/png');
      expect(prisma.upload.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ url: imageUrl, size: imageBytes.length }),
      }));
    } finally {
      await app?.close();
      for (const [key, value] of Object.entries(previousEnv)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
});
