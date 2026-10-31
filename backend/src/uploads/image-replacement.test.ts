import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import type { UploadStorage } from './upload-storage';
import {
  deletePreviousImage,
  getPrivateUploadObjectKey,
  ImageReplacementError,
  recordSavedImageReplacement,
  verifyImageReplacement,
  type ReplacementTarget,
} from './image-replacement';

const actorId = 'admin-user';
const previousKey = `${actorId}/uploads/1000-old.png`;
const replacementKey = `${actorId}/uploads/2000-new.png`;
const previousUrl = `/images/uploads/${previousKey}`;
const replacementUrl = `/images/uploads/${replacementKey}`;

function createFixture(options: {
  referenced?: boolean;
  targetMatches?: boolean;
  storageDeleteFails?: boolean;
  previousDeleted?: boolean;
} = {}) {
  const uploads = new Map([
    [previousKey, { userId: actorId, url: previousUrl, deletedAt: options.previousDeleted ? new Date() : null }],
    [replacementKey, { userId: actorId, url: replacementUrl, deletedAt: null }],
  ]);
  const jobs = new Map([
    [previousKey, { status: options.previousDeleted ? 'done' : 'pending', completedAt: options.previousDeleted ? new Date() : null }],
  ]);
  const auditLogs: Array<{ id: string; userId: string; action: string; meta: string }> = [];
  const queryRaw = vi.fn(async (query: { sql: string; values: unknown[] }) => {
    if (query.sql.includes('pg_advisory_xact_lock')) return [];
    if (query.sql.includes('"image_json_object_keys"')) {
      return [{ referenced: Boolean(options.referenced) }];
    }
    if (query.sql.includes('"profile" ->>') || query.sql.includes('"avatarUrl" =')) {
      return [{ matches: options.targetMatches !== false }];
    }
    if (query.sql.includes('FROM "Upload"')) {
      return uploads.has(String(query.values[0])) ? [uploads.get(String(query.values[0]))] : [];
    }
    if (query.sql.includes('FROM "ImageCleanupJob"')) {
      return jobs.has(String(query.values[0])) ? [jobs.get(String(query.values[0]))] : [];
    }
    throw new Error(`Unexpected SQL in fixture: ${query.sql}`);
  });
  const executeRaw = vi.fn(async (query: { sql: string }) => {
    if (query.sql.includes('UPDATE "Upload"')) {
      const upload = uploads.get(previousKey);
      if (upload) upload.deletedAt = new Date();
      return upload ? 1 : 0;
    }
    if (query.sql.includes('UPDATE "ImageCleanupJob"')) {
      const job = jobs.get(previousKey);
      if (job) {
        job.status = 'done';
        job.completedAt = new Date();
      }
      return job ? 1 : 0;
    }
    throw new Error(`Unexpected SQL in fixture: ${query.sql}`);
  });
  const auditLog = {
    findFirst: vi.fn(async ({ where }: { where: { userId: string; action: { in: string[] }; meta: string } }) =>
      auditLogs.find((entry) => (
        entry.userId === where.userId
        && where.action.in.includes(entry.action)
        && entry.meta === where.meta
      )) ?? null),
    create: vi.fn(async ({ data }: { data: { userId: string; action: string; meta: string } }) => {
      const entry = { id: `audit-${auditLogs.length}`, ...data };
      auditLogs.push(entry);
      return entry;
    }),
    updateMany: vi.fn(async ({ where, data }: {
      where: { userId: string; action: string; meta: string };
      data: { action: string };
    }) => {
      const matches = auditLogs.filter((entry) => (
        entry.userId === where.userId && entry.action === where.action && entry.meta === where.meta
      ));
      matches.forEach((entry) => { entry.action = data.action; });
      return { count: matches.length };
    }),
  };
  const transaction = { $queryRaw: queryRaw, $executeRaw: executeRaw, auditLog };
  const prisma = {
    $transaction: vi.fn(async (callback: (tx: typeof transaction) => unknown) => callback(transaction)),
  } as unknown as PrismaClient;
  const storage: UploadStorage = {
    driver: 's3',
    storeFile: vi.fn(),
    readFile: vi.fn(async () => ({ buffer: Buffer.from('image-bytes'), contentType: 'image/png' })),
    deleteFile: options.storageDeleteFails
      ? vi.fn(async () => { throw new Error('R2 unavailable'); })
      : vi.fn(async () => undefined),
  };
  const target: ReplacementTarget = {
    entity: 'country',
    entityId: 'AL',
    field: 'heroImageUrl',
    previousUrl,
    replacementUrl,
  };
  return { prisma, storage, target, uploads, jobs, queryRaw, executeRaw, auditLogs };
}

async function associateReplacement(fixture: ReturnType<typeof createFixture>) {
  return fixture.prisma.$transaction((transaction) => (
    recordSavedImageReplacement(transaction as any, actorId, fixture.target)
  ));
}

describe('private upload object key validation', () => {
  it('accepts a private R2 image path and rejects external or unsafe paths', () => {
    expect(getPrivateUploadObjectKey(previousUrl)).toBe(previousKey);
    expect(getPrivateUploadObjectKey('https://outside.example/image.png')).toBeNull();
    expect(getPrivateUploadObjectKey('/images/uploads/user/../secret.png')).toBeNull();
    expect(getPrivateUploadObjectKey('/images/uploads/user/%2e%2e/secret.png')).toBeNull();
    expect(getPrivateUploadObjectKey('/images/uploads/user/secret.png?download=1')).toBeNull();
  });
});

describe('image replacement lifecycle', () => {
  const originalStorageDriver = process.env.UPLOAD_STORAGE_DRIVER;

  beforeEach(() => {
    process.env.UPLOAD_STORAGE_DRIVER = 'r2';
  });

  afterEach(() => {
    if (originalStorageDriver === undefined) delete process.env.UPLOAD_STORAGE_DRIVER;
    else process.env.UPLOAD_STORAGE_DRIVER = originalStorageDriver;
  });

  it('offers deletion only after the saved replacement and R2 object are verified', async () => {
    const fixture = createFixture();
    await expect(associateReplacement(fixture)).resolves.toBe(true);

    await expect(verifyImageReplacement(fixture.prisma, fixture.storage, actorId, fixture.target))
      .resolves.toEqual({ verified: true, canDeletePrevious: true, reason: null });
    expect(fixture.storage.readFile).toHaveBeenCalledWith(replacementKey);
  });

  it('does not offer deletion without an association from the saved record update', async () => {
    const fixture = createFixture();

    await expect(verifyImageReplacement(fixture.prisma, fixture.storage, actorId, fixture.target))
      .resolves.toMatchObject({ verified: true, canDeletePrevious: false });
    expect(fixture.storage.readFile).toHaveBeenCalledTimes(1);
  });

  it('refuses deletion when the old object was not associated with this exact record field update', async () => {
    const fixture = createFixture();
    await associateReplacement(fixture);
    const differentFieldTarget = { ...fixture.target, field: 'flagImageUrl' as const };

    await expect(deletePreviousImage(fixture.prisma, fixture.storage, actorId, differentFieldTarget))
      .rejects.toMatchObject({ code: 'REPLACEMENT_NOT_ELIGIBLE' });
    expect(fixture.storage.deleteFile).not.toHaveBeenCalled();
  });

  it('refuses deletion eligibility if the record did not save the replacement', async () => {
    const fixture = createFixture({ targetMatches: false });

    await expect(verifyImageReplacement(fixture.prisma, fixture.storage, actorId, fixture.target))
      .rejects.toMatchObject({ code: 'REPLACEMENT_NOT_SAVED' });
  });

  it('does not verify or offer deletion when the replacement image cannot be read', async () => {
    const fixture = createFixture();
    fixture.storage.readFile = vi.fn(async () => { throw new Error('not found'); });

    await expect(verifyImageReplacement(fixture.prisma, fixture.storage, actorId, fixture.target)).rejects.toThrow();
    expect(fixture.prisma.$transaction).not.toHaveBeenCalled();
  });

  it('does not mark a shared previous image as deletable', async () => {
    const fixture = createFixture({ referenced: true });

    await expect(verifyImageReplacement(fixture.prisma, fixture.storage, actorId, fixture.target))
      .resolves.toMatchObject({ verified: true, canDeletePrevious: false });
  });

  it('deletes only the exact old object and completes its cleanup metadata', async () => {
    const fixture = createFixture();
    await associateReplacement(fixture);

    await expect(deletePreviousImage(fixture.prisma, fixture.storage, actorId, fixture.target))
      .resolves.toEqual({ deleted: true, alreadyDeleted: false });
    expect(fixture.storage.deleteFile).toHaveBeenCalledTimes(1);
    expect(fixture.storage.deleteFile).toHaveBeenCalledWith(previousKey);
    expect(fixture.uploads.get(previousKey)?.deletedAt).toBeInstanceOf(Date);
    expect(fixture.jobs.get(previousKey)?.status).toBe('done');
    expect(fixture.storage.deleteFile).not.toHaveBeenCalledWith(replacementKey);
  });

  it('refuses deletion if another active record references the old object', async () => {
    const fixture = createFixture({ referenced: true });
    await associateReplacement(fixture);

    await expect(deletePreviousImage(fixture.prisma, fixture.storage, actorId, fixture.target))
      .rejects.toMatchObject({ code: 'IMAGE_STILL_REFERENCED' });
    expect(fixture.storage.deleteFile).not.toHaveBeenCalled();
    expect(fixture.executeRaw).not.toHaveBeenCalled();
  });

  it.each([
    ['external URL', 'https://outside.example/image.png'],
    ['path traversal', '/images/uploads/admin-user/../private.png'],
  ])('rejects %s without touching storage', async (_label, unsafeUrl) => {
    const fixture = createFixture();
    const target = { ...fixture.target, previousUrl: unsafeUrl };

    await expect(deletePreviousImage(fixture.prisma, fixture.storage, actorId, target))
      .rejects.toBeInstanceOf(ImageReplacementError);
    expect(fixture.storage.deleteFile).not.toHaveBeenCalled();
  });

  it('does not permit deleting another user’s upload', async () => {
    const fixture = createFixture();

    await expect(deletePreviousImage(fixture.prisma, fixture.storage, 'different-user', fixture.target))
      .rejects.toMatchObject({ code: 'IMAGE_NOT_OWNED' });
    expect(fixture.storage.deleteFile).not.toHaveBeenCalled();
  });

  it('leaves lifecycle state unchanged when R2 does not confirm deletion', async () => {
    const fixture = createFixture({ storageDeleteFails: true });
    await associateReplacement(fixture);

    await expect(deletePreviousImage(fixture.prisma, fixture.storage, actorId, fixture.target))
      .rejects.toMatchObject({ code: 'R2_DELETE_FAILED', statusCode: 502 });
    expect(fixture.executeRaw).not.toHaveBeenCalled();
    expect(fixture.jobs.get(previousKey)?.status).toBe('pending');
  });

  it('makes repeated deletion requests idempotent without deleting another object', async () => {
    const fixture = createFixture();
    await associateReplacement(fixture);

    await expect(deletePreviousImage(fixture.prisma, fixture.storage, actorId, fixture.target))
      .resolves.toEqual({ deleted: true, alreadyDeleted: false });
    await expect(deletePreviousImage(fixture.prisma, fixture.storage, actorId, fixture.target))
      .resolves.toEqual({ deleted: true, alreadyDeleted: true });
    expect(fixture.storage.deleteFile).toHaveBeenCalledTimes(1);
    expect(fixture.storage.deleteFile).toHaveBeenCalledWith(previousKey);
    expect(fixture.storage.deleteFile).not.toHaveBeenCalledWith(replacementKey);
  });

  it('reports database finalization failure after object deletion so the same request can be retried', async () => {
    const fixture = createFixture();
    await associateReplacement(fixture);
    fixture.executeRaw.mockImplementationOnce(async () => {
      throw new Error('database unavailable');
    });

    await expect(deletePreviousImage(fixture.prisma, fixture.storage, actorId, fixture.target))
      .rejects.toThrow('database unavailable');
    expect(fixture.storage.deleteFile).toHaveBeenCalledWith(previousKey);
    expect(fixture.uploads.get(previousKey)?.deletedAt).toBeNull();
    expect(fixture.jobs.get(previousKey)?.status).toBe('pending');
  });

  it('fails closed when the configured storage driver is not R2', async () => {
    const fixture = createFixture();
    process.env.UPLOAD_STORAGE_DRIVER = 'local';

    await expect(deletePreviousImage(fixture.prisma, fixture.storage, actorId, fixture.target))
      .rejects.toMatchObject({ code: 'R2_REQUIRED' });
    expect(fixture.prisma.$transaction).not.toHaveBeenCalled();
    expect(fixture.storage.deleteFile).not.toHaveBeenCalled();
  });
});
