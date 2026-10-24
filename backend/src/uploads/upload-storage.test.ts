import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createUploadStorage, getUploadStorageDriver } from './upload-storage';

describe('upload storage', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.UPLOAD_STORAGE_DRIVER;
    delete process.env.OBJECT_STORAGE_BUCKET;
    delete process.env.OBJECT_STORAGE_ENDPOINT;
    delete process.env.OBJECT_STORAGE_REGION;
    delete process.env.OBJECT_STORAGE_ACCESS_KEY_ID;
    delete process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('defaults to local storage when no object-store config is provided', () => {
    expect(getUploadStorageDriver()).toBe('local');
  });

  it('stores files locally and returns a private backend image URL', async () => {
    const storage = createUploadStorage();
    const result = await storage.storeFile({
      userId: 'user-123',
      filename: 'sample.png',
      contentType: 'image/png',
      buffer: Buffer.from('png-bytes'),
    });

    expect(result.url).toMatch(/^\/images\/uploads\/user-123\//);
    expect(result.fileKey).toContain('user-123');
    expect(result.size).toBe(9);
  });

  it('fails safely when the S3/R2 driver is selected without credentials', async () => {
    process.env.UPLOAD_STORAGE_DRIVER = 's3';
    process.env.OBJECT_STORAGE_BUCKET = 'big-cities-staging-images';
    process.env.OBJECT_STORAGE_REGION = 'auto';
    delete process.env.OBJECT_STORAGE_ENDPOINT;
    delete process.env.OBJECT_STORAGE_ACCESS_KEY_ID;
    delete process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY;

    expect(() => createUploadStorage()).toThrow(/OBJECT_STORAGE_/i);
  });
});
