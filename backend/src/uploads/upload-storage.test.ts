import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'path';
import { S3Client } from '@aws-sdk/client-s3';
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
    vi.restoreAllMocks();
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
    await storage.deleteFile(result.fileKey);
  });

  it('generates collision-resistant keys for repeated uploads with the same name', async () => {
    const storage = createUploadStorage();
    const input = {
      userId: 'user-123',
      filename: 'same-name.png',
      contentType: 'image/png',
      buffer: Buffer.from('png-bytes'),
    };

    const first = await storage.storeFile(input);
    const second = await storage.storeFile(input);

    expect(first.fileKey).not.toBe(second.fileKey);
    expect(first.fileKey).toMatch(/^user-123\/\d+-[0-9a-f-]{36}-same-name\.png$/);
    expect(second.fileKey).toMatch(/^user-123\/\d+-[0-9a-f-]{36}-same-name\.png$/);
    await storage.deleteFile(first.fileKey);
    await storage.deleteFile(second.fileKey);
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

  it('validates keys before issuing an object-store delete', async () => {
    process.env.UPLOAD_STORAGE_DRIVER = 's3';
    process.env.OBJECT_STORAGE_BUCKET = 'test-only-mocked-bucket';
    process.env.OBJECT_STORAGE_ENDPOINT = 'https://objects.invalid';
    process.env.OBJECT_STORAGE_ACCESS_KEY_ID = 'test-access-key';
    process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY = 'test-secret-key';
    const send = vi.spyOn(S3Client.prototype, 'send').mockResolvedValue({} as never);
    const storage = createUploadStorage();

    await expect(storage.deleteFile('../outside.png')).rejects.toThrow(/Invalid object storage key/);
    expect(send).not.toHaveBeenCalled();

    await storage.deleteFile('user-123/1000-random-id-image.png');
    expect(send).toHaveBeenCalledOnce();
    expect(send.mock.calls[0][0].input).toMatchObject({
      Bucket: 'test-only-mocked-bucket',
      Key: 'user-123/1000-random-id-image.png',
    });
    send.mockRestore();
  });
});
