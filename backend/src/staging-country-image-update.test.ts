import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import AuthService from './auth/auth.service';
import registerCatalogRoutes from './catalog/catalog.controller';
import { registerStagingWriteGuard } from './staging-write-guard';

const storage = vi.hoisted(() => ({
  storeFile: vi.fn(),
  readFile: vi.fn(),
  deleteFile: vi.fn(),
}));

vi.mock('./uploads/upload-storage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./uploads/upload-storage')>();
  return {
    ...actual,
    createUploadStorage: () => ({ driver: 's3', ...storage }),
  };
});

const originalEnv = new Map<string, string | undefined>();
const envKeys = ['DATABASE_WRITES_ENABLED', 'UPLOADS_ENABLED', 'UPLOAD_STORAGE_DRIVER', 'IMAGE_CLEANUP_ENABLED', 'JWT_ACCESS_TOKEN_SECRET'];

describe('country image update transaction', () => {
  let app: ReturnType<typeof Fastify>;
  let prisma: any;
  let authorization: string;
  let country: Record<string, any>;
  let uploads: Array<Record<string, unknown>>;
  let failCountryUpdate: boolean;
  let nextFileId: number;
  let storedObjects: Map<string, { buffer: Buffer; contentType: string }>;
  let cleanupJobs: Array<Record<string, unknown>>;
  let imageBytes: Buffer;

  beforeEach(async () => {
    for (const key of envKeys) originalEnv.set(key, process.env[key]);
    process.env.DATABASE_WRITES_ENABLED = 'true';
    process.env.UPLOADS_ENABLED = 'true';
    process.env.UPLOAD_STORAGE_DRIVER = 's3';
    process.env.IMAGE_CLEANUP_ENABLED = 'false';
    process.env.JWT_ACCESS_TOKEN_SECRET = 'country-image-update-test-secret';
    country = {
      code: 'ZZ',
      name: 'Old Name',
      continentId: null,
      continent: null,
      profile: { heroImageUrl: null, flagImageUrl: null, tagline: 'Keep me' },
    };
    uploads = [];
    failCountryUpdate = false;
    nextFileId = 0;
    storedObjects = new Map();
    cleanupJobs = [];
    imageBytes = await sharp({
      create: { width: 1, height: 1, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    }).png().toBuffer();
    vi.clearAllMocks();
    storage.storeFile.mockImplementation(async ({ userId, filename, contentType, buffer }) => {
      nextFileId += 1;
      const fileKey = `${userId}/${nextFileId}-${filename}`;
      storedObjects.set(fileKey, { buffer, contentType });
      return {
        fileKey,
        url: `/images/uploads/${fileKey}`,
        size: buffer.length,
        contentType,
      };
    });
    storage.readFile.mockImplementation(async (fileKey: string) => {
      const image = storedObjects.get(fileKey);
      if (!image) throw new Error('Object not found');
      return image;
    });
    storage.deleteFile.mockImplementation(async (fileKey: string) => {
      storedObjects.delete(fileKey);
    });

    prisma = {
      user: { findUnique: vi.fn(async () => ({ role: { name: 'admin' } })) },
      country: {
        findUnique: vi.fn(async () => ({ ...country })),
        update: vi.fn(),
      },
      continent: { findUnique: vi.fn(async () => null) },
      city: { count: vi.fn(async () => 0) },
      event: { count: vi.fn(async () => 0) },
      $transaction: vi.fn(async (callback: (transaction: any) => Promise<unknown>) => {
        const pendingUploads: Array<Record<string, unknown>> = [];
        let pendingCountry: Record<string, unknown> | null = null;
        const result = await callback({
          $queryRaw: async () => [],
          upload: { create: async ({ data }: { data: Record<string, unknown> }) => pendingUploads.push(data) },
          imageCleanupJob: {
            findUnique: async () => null,
            upsert: async ({ create, update }: { create: Record<string, unknown>; update: Record<string, unknown> }) => {
              const job = { ...(update ?? create) };
              cleanupJobs.push(job);
              return job;
            },
          },
          country: {
            update: async ({ where, data }: { where: { code: string }; data: Record<string, unknown> }) => {
              if (failCountryUpdate) throw new Error('simulated database failure');
              if (where.code !== country.code) throw new Error('unexpected country key');
              pendingCountry = { ...country, ...data };
              return { ...pendingCountry, continent: null };
            },
          },
        });
        if (pendingCountry) country = pendingCountry;
        uploads.push(...pendingUploads);
        return result;
      }),
    };
    const auth = new AuthService(prisma);
    authorization = `Bearer ${auth.signAccessToken('admin-user')}`;

    app = Fastify();
    await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024, files: 2 } });
    registerStagingWriteGuard(app);
    registerCatalogRoutes(app, prisma);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    for (const key of envKeys) {
      const value = originalEnv.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    originalEnv.clear();
  });

  function imageRequest(files: Array<{ field: string; filename?: string; contentType?: string; bytes?: Buffer }>) {
    const boundary = 'BigCitiesCountryImageBoundary';
    const parts: Buffer[] = [
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="name"\r\n\r\nUpdated Name\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="continentId"\r\n\r\n\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="profile"\r\n\r\n${JSON.stringify(country.profile)}\r\n`),
    ];
    for (const file of files) {
      parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${file.field}"; filename="${file.filename ?? 'replacement.png'}"\r\nContent-Type: ${file.contentType ?? 'image/png'}\r\n\r\n`));
      parts.push(file.bytes ?? imageBytes, Buffer.from('\r\n'));
    }
    parts.push(Buffer.from(`--${boundary}--\r\n`));
    return app.inject({
      method: 'POST',
      url: '/countries/ZZ/images',
      headers: { authorization, 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: Buffer.concat(parts),
    });
  }

  it.each([
    ['heroImage', 'heroImageUrl'],
    ['flagImage', 'flagImageUrl'],
  ])('persists an independent %s replacement and verifies the stored object', async (fileField, profileField) => {
    const response = await imageRequest([{ field: fileField }]);

    expect(response.statusCode).toBe(200);
    expect(response.json().data.profile[profileField]).toMatch(/^\/images\/uploads\/admin-user\//);
    expect(country.profile[profileField]).toBe(response.json().data.profile[profileField]);
    expect(country.profile.tagline).toBe('Keep me');
    expect(uploads).toHaveLength(1);
    expect(storage.storeFile).toHaveBeenCalledOnce();
    expect(storage.readFile).toHaveBeenCalledOnce();
    expect(storage.deleteFile).not.toHaveBeenCalled();
    expect(prisma.country.update).not.toHaveBeenCalled();
  });

  it('updates hero and flag references together in one database transaction', async () => {
    const response = await imageRequest([
      { field: 'heroImage', filename: 'hero.png' },
      { field: 'flagImage', filename: 'flag.png' },
    ]);

    expect(response.statusCode).toBe(200);
    expect(response.json().data.profile.heroImageUrl).not.toBe(response.json().data.profile.flagImageUrl);
    expect(country.profile.heroImageUrl).toBe(response.json().data.profile.heroImageUrl);
    expect(country.profile.flagImageUrl).toBe(response.json().data.profile.flagImageUrl);
    expect(uploads).toHaveLength(2);
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(storage.readFile).toHaveBeenCalledTimes(2);
  });

  it('rejects invalid image bytes before storage or database writes', async () => {
    const response = await imageRequest([{ field: 'heroImage', bytes: Buffer.from('not an image') }]);

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: { code: 'INVALID_IMAGE' } });
    expect(storage.storeFile).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(country.name).toBe('Old Name');
  });

  it('rejects unsupported extensions and missing authentication before storage', async () => {
    const invalidExtension = await imageRequest([{ field: 'heroImage', filename: 'replacement.exe' }]);
    const unauthorized = await app.inject({
      method: 'POST',
      url: '/countries/ZZ/images',
      headers: { 'content-type': 'multipart/form-data; boundary=unused' },
      payload: '',
    });

    expect(invalidExtension.statusCode).toBe(400);
    expect(unauthorized.statusCode).toBe(401);
    expect(storage.storeFile).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('queues an earlier object if a later R2 upload fails', async () => {
    storage.storeFile.mockImplementationOnce(async ({ userId, filename, contentType, buffer }) => {
      const fileKey = `${userId}/partial-${filename}`;
      storedObjects.set(fileKey, { buffer, contentType });
      return { fileKey, url: `/images/uploads/${fileKey}`, size: buffer.length };
    }).mockRejectedValueOnce(new Error('simulated R2 failure'));

    const response = await imageRequest([
      { field: 'heroImage', filename: 'hero.png' },
      { field: 'flagImage', filename: 'flag.png' },
    ]);

    expect(response.statusCode).toBe(500);
    expect(storage.deleteFile).not.toHaveBeenCalled();
    expect(storedObjects.has('admin-user/partial-hero.png')).toBe(true);
    expect(cleanupJobs).toHaveLength(1);
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(country.name).toBe('Old Name');
  });

  it('queues an object when R2 read-back verification does not match the selected image', async () => {
    storage.readFile.mockResolvedValueOnce({ buffer: Buffer.from('different bytes'), contentType: 'image/png' });
    const response = await imageRequest([{ field: 'heroImage' }]);

    expect(response.statusCode).toBe(500);
    expect(storage.deleteFile).not.toHaveBeenCalled();
    expect(storedObjects.size).toBe(1);
    expect(cleanupJobs).toHaveLength(1);
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(country.profile.heroImageUrl).toBeNull();
  });

  it('queues newly uploaded objects and preserves existing country data on database failure', async () => {
    failCountryUpdate = true;
    const previousKey = 'admin-user/uploads/previous-image.png';
    const previousUrl = `/images/uploads/${previousKey}`;
    country.profile.heroImageUrl = previousUrl;
    storedObjects.set(previousKey, { buffer: imageBytes, contentType: 'image/png' });
    const response = await imageRequest([
      { field: 'heroImage', filename: 'hero.png' },
      { field: 'flagImage', filename: 'flag.png' },
    ]);

    expect(response.statusCode).toBe(500);
    expect(response.json()).toMatchObject({ error: { code: 'COUNTRY_IMAGE_UPDATE_FAILED' } });
    expect(storage.deleteFile).not.toHaveBeenCalled();
    expect(cleanupJobs).toHaveLength(2);
    expect(storedObjects.size).toBe(3);
    expect(country.name).toBe('Old Name');
    expect(country.profile).toEqual({ heroImageUrl: previousUrl, flagImageUrl: null, tagline: 'Keep me' });
    expect(storedObjects.has(previousKey)).toBe(true);
    expect(uploads).toHaveLength(0);
  });

  it('queues failed country objects without risking deletion of the previous image', async () => {
    failCountryUpdate = true;
    const previousKey = 'admin-user/uploads/previous-image.png';
    const previousUrl = `/images/uploads/${previousKey}`;
    country.profile.heroImageUrl = previousUrl;
    storedObjects.set(previousKey, { buffer: imageBytes, contentType: 'image/png' });
    const response = await imageRequest([{ field: 'heroImage' }]);

    expect(response.statusCode).toBe(500);
    expect(response.json()).toMatchObject({ error: { code: 'COUNTRY_IMAGE_UPDATE_FAILED' } });
    expect(country.profile.heroImageUrl).toBe(previousUrl);
    expect(storedObjects.has(previousKey)).toBe(true);
    expect(cleanupJobs).toHaveLength(1);
    expect(uploads).toHaveLength(0);
  });
});
