import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const awsMocks = vi.hoisted(() => ({
  send: vi.fn(),
  clients: [] as Array<{ destroy: ReturnType<typeof vi.fn> }>,
}));

vi.mock('@aws-sdk/client-s3', () => {
  class S3Client {
    send = awsMocks.send;
    destroy = vi.fn();

    constructor() {
      awsMocks.clients.push(this);
    }
  }
  class GetObjectCommand {
    constructor(public input: Record<string, unknown>) {}
  }
  class ListObjectsV2Command {
    constructor(public input: Record<string, unknown>) {}
  }
  class PutObjectCommand {
    constructor(public input: Record<string, unknown>) {}
  }
  class DeleteObjectCommand {
    constructor(public input: Record<string, unknown>) {}
  }
  return {
    DeleteObjectCommand,
    GetObjectCommand,
    ListObjectsV2Command,
    PutObjectCommand,
    S3Client,
  };
});

import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { probeR2ReadAccess } from './upload-storage';

describe('read-only R2 connectivity probe', () => {
  const keys = [
    'UPLOAD_STORAGE_DRIVER',
    'OBJECT_STORAGE_BUCKET',
    'OBJECT_STORAGE_ENDPOINT',
    'OBJECT_STORAGE_REGION',
    'OBJECT_STORAGE_ACCESS_KEY_ID',
    'OBJECT_STORAGE_SECRET_ACCESS_KEY',
  ] as const;
  const originalEnv = new Map<string, string | undefined>();

  beforeEach(() => {
    for (const key of keys) originalEnv.set(key, process.env[key]);
    process.env.UPLOAD_STORAGE_DRIVER = 'r2';
    process.env.OBJECT_STORAGE_BUCKET = 'probe-test-bucket';
    process.env.OBJECT_STORAGE_ENDPOINT = 'https://storage.example.invalid';
    process.env.OBJECT_STORAGE_REGION = 'auto';
    process.env.OBJECT_STORAGE_ACCESS_KEY_ID = 'test-access-key';
    process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY = 'test-secret-key';
    awsMocks.send.mockReset();
    awsMocks.clients.length = 0;
  });

  afterEach(() => {
    for (const key of keys) {
      const value = originalEnv.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('lists the bucket and reads only one byte from a non-empty object without writes', async () => {
    awsMocks.send.mockImplementation(async (command: { constructor: { name: string }; input: Record<string, unknown> }) => {
      if (command.constructor.name === 'ListObjectsV2Command') {
        return { Contents: [{ Key: 'must-not-be-printed', Size: 128 }] };
      }
      if (command.constructor.name === 'GetObjectCommand') {
        return { Body: new Uint8Array([0x42]) };
      }
      throw new Error('Unexpected storage command');
    });

    const report = await probeR2ReadAccess();

    expect(awsMocks.send.mock.calls.map(([command]) => command.constructor.name))
      .toEqual(['ListObjectsV2Command', 'GetObjectCommand']);
    expect(report).toEqual({
      bucketAccess: 'confirmed',
      listAccess: 'confirmed',
      objectReadAccess: 'confirmed',
    });
    expect(awsMocks.send).toHaveBeenCalledTimes(2);
    expect(awsMocks.send.mock.calls[0][0].input).toMatchObject({ MaxKeys: 100 });
    expect(awsMocks.send.mock.calls[1][0].input).toMatchObject({ Range: 'bytes=0-0' });
    expect(awsMocks.send.mock.calls.some(([command]) =>
      command instanceof PutObjectCommand || command instanceof DeleteObjectCommand,
    )).toBe(false);
    expect(awsMocks.clients[0].destroy).toHaveBeenCalledOnce();
  });

  it('does not request an object read when listing contains no non-empty object', async () => {
    awsMocks.send.mockResolvedValue({ Contents: [] });

    const report = await probeR2ReadAccess();

    expect(report).toEqual({
      bucketAccess: 'confirmed',
      listAccess: 'confirmed',
      objectReadAccess: 'not_tested_no_nonempty_object',
    });
    expect(awsMocks.send).toHaveBeenCalledTimes(1);
    expect(awsMocks.send.mock.calls[0][0]).toBeInstanceOf(ListObjectsV2Command);
  });

  it('reports read permission failure without changing bucket contents', async () => {
    awsMocks.send.mockImplementation(async (command: { constructor: { name: string }; input: Record<string, unknown> }) => {
      if (command.constructor.name === 'ListObjectsV2Command') return { Contents: [{ Key: 'private-key', Size: 12 }] };
      if (command.constructor.name === 'GetObjectCommand') throw new Error('AccessDenied');
      throw new Error('Unexpected storage command');
    });

    const report = await probeR2ReadAccess();

    expect(report.objectReadAccess).toBe('failed');
    expect(awsMocks.send).toHaveBeenCalledTimes(2);
    expect(awsMocks.send.mock.calls.some(([command]) =>
      command instanceof PutObjectCommand || command instanceof DeleteObjectCommand,
    )).toBe(false);
  });
});
