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

  it('disables uploads by default when R2 is not configured', async () => {
    expect(getUploadStorageDriver()).toBe('disabled');
    await expect(createUploadStorage().storeFile({
      userId: 'user-123',
      filename: 'sample.png',
      contentType: 'image/png',
      buffer: Buffer.from('png-bytes'),
    })).rejects.toThrow(/Uploads are disabled/i);
  });

  it('does not allow local filesystem storage', () => {
    process.env.UPLOAD_STORAGE_DRIVER = 'local';
    expect(() => getUploadStorageDriver()).toThrow(/Unsupported image storage driver/i);
  });

  it('fails safely when R2 is selected without credentials', async () => {
    process.env.UPLOAD_STORAGE_DRIVER = 'r2';
    process.env.OBJECT_STORAGE_BUCKET = 'big-cities-staging-images';
    process.env.OBJECT_STORAGE_REGION = 'auto';
    delete process.env.OBJECT_STORAGE_ENDPOINT;
    delete process.env.OBJECT_STORAGE_ACCESS_KEY_ID;
    delete process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY;

    expect(() => createUploadStorage()).toThrow(/OBJECT_STORAGE_/i);
  });

  it('recognizes the S3-compatible R2 driver aliases', () => {
    process.env.UPLOAD_STORAGE_DRIVER = 'r2';
    expect(getUploadStorageDriver()).toBe('s3');
    process.env.UPLOAD_STORAGE_DRIVER = 's3';
    expect(getUploadStorageDriver()).toBe('s3');
  });
});
