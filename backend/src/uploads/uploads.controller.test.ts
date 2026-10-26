import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import registerUploadRoutes from './uploads.controller';
import { registerUploadImageRoutes, type UploadStorage } from './upload-storage';

const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function createStorage(): UploadStorage {
  return {
    driver: 's3',
    storeFile: vi.fn(async ({ userId, filename, buffer }) => ({
      fileKey: `${userId}/${filename}`,
      url: `/images/uploads/${userId}/${filename}`,
      size: buffer.length,
    })),
    readFile: vi.fn(async () => ({ buffer: Buffer.alloc(0), contentType: 'image/png' })),
    deleteFile: vi.fn(async () => undefined),
  };
}

function multipartImage(bytes: Buffer, filename = 'upload.png', contentType = 'image/png') {
  const boundary = 'BigCitiesUploadBoundary';
  return {
    boundary,
    payload: Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`),
      bytes,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]),
  };
}

describe('admin image upload validation', () => {
  const envKeys = ['DATABASE_WRITES_ENABLED', 'UPLOADS_ENABLED', 'JWT_ACCESS_TOKEN_SECRET'] as const;
  const originalEnv = new Map<string, string | undefined>();
  let app: ReturnType<typeof Fastify>;
  let uploadCreate: ReturnType<typeof vi.fn>;
  let storage: UploadStorage;
  let authorization: string;

  beforeEach(async () => {
    for (const key of envKeys) originalEnv.set(key, process.env[key]);
    process.env.DATABASE_WRITES_ENABLED = 'true';
    process.env.UPLOADS_ENABLED = 'true';
    process.env.JWT_ACCESS_TOKEN_SECRET = 'test-upload-secret';
    authorization = `Bearer ${jwt.sign({ sub: 'admin-user' }, process.env.JWT_ACCESS_TOKEN_SECRET)}`;
    uploadCreate = vi.fn().mockResolvedValue({});
    storage = createStorage();
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'admin-user', role: { name: 'admin' } }) },
      upload: { create: uploadCreate },
    } as any;
    app = Fastify();
    await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
    registerUploadRoutes(app, prisma, storage);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    for (const key of envKeys) {
      const value = originalEnv.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  function imageRequest(bytes: Buffer, filename = 'upload.png', contentType = 'image/png', token: string | null = authorization) {
    const { boundary, payload } = multipartImage(bytes, filename, contentType);
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
    expect(storage.storeFile).not.toHaveBeenCalled();
  });

  it('rejects missing or invalid admin credentials before storing a file', async () => {
    const missingToken = await imageRequest(Buffer.from('not read'), 'upload.png', 'image/png', null);
    const invalidToken = await imageRequest(Buffer.from('not read'), 'upload.png', 'image/png', 'Bearer invalid');

    expect(missingToken.statusCode).toBe(401);
    expect(invalidToken.statusCode).toBe(403);
    expect(uploadCreate).not.toHaveBeenCalled();
    expect(storage.storeFile).not.toHaveBeenCalled();
  });

  it('rejects mismatched extensions and files larger than 5 MB', async () => {
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
    expect(storage.storeFile).not.toHaveBeenCalled();
  });

  it('rejects uploads when storage is disabled rather than falling back to local files', async () => {
    storage.driver = 'disabled';
    const response = await imageRequest(pngHeader);

    expect(response.statusCode).toBe(503);
    expect(uploadCreate).not.toHaveBeenCalled();
    expect(storage.storeFile).not.toHaveBeenCalled();
  });

  it('stores validated images in the configured object storage before creating metadata', async () => {
    const response = await imageRequest(pngHeader);

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toHaveLength(1);
    expect(storage.storeFile).toHaveBeenCalledOnce();
    expect(uploadCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: 'admin-user', type: 'image/png', size: pngHeader.length }),
    }));
  });

  it('does not create metadata for the unsupported presigned-upload endpoint', async () => {
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
});

describe('R2-backed image retrieval', () => {
  it('serves stored bytes after the API server is recreated', async () => {
    const userId = `dashboard-test-${randomUUID()}`;
    const secret = 'test-upload-persistence-secret';
    const imageBytes = pngHeader;
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
    const uploadCreate = vi.fn().mockResolvedValue({});
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ id: userId, role: { name: 'admin' } }) },
      upload: { create: uploadCreate },
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
    process.env.UPLOAD_STORAGE_DRIVER = 'r2';

    const createApp = async () => {
      const server = Fastify();
      await server.register(multipart, { limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
      registerUploadImageRoutes(server, storage);
      registerUploadRoutes(server, prisma, storage);
      await server.ready();
      return server;
    };

    let app: ReturnType<typeof Fastify> | undefined;
    try {
      app = await createApp();
      const { boundary, payload } = multipartImage(imageBytes, 'persistent.png');
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
      expect(uploadCreate).toHaveBeenCalledWith(expect.objectContaining({
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
