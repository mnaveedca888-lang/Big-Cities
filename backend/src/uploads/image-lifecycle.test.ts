import fs from 'fs';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UploadStorage } from './upload-storage';
import {
  enqueueExpiredUploads,
  enqueueOwnedImageCleanup,
  getManagedImageObjectKey,
  getUnattachedUploadExpiresAt,
  processImageCleanupJobs,
  runImageCleanupCycle,
  drainImageCleanupQueue,
} from './image-lifecycle';

const fileKey = 'test-user/uploads/1000-unique-image.png';

function createLifecycleFixture(options: { referenced?: boolean; pending?: boolean; fileKey?: string } = {}) {
  const fixtureFileKey = options.fileKey ?? fileKey;
  const job: Record<string, any> = {
    id: 'cleanup-job-1',
    fileKey: fixtureFileKey,
    status: 'pending',
    attempts: 0,
    completedAt: null,
    nextAttemptAt: new Date(Date.now() - 1000),
    createdAt: new Date(),
  };
  const upload: Record<string, any> = {
    id: 'upload-1',
    fileKey: fixtureFileKey,
    url: `/images/uploads/${fixtureFileKey}`,
    attachedAt: null,
    expiresAt: options.pending ? new Date(Date.now() + 60_000) : null,
    deletedAt: null,
    createdAt: new Date(),
  };
  const queryRaw = vi.fn(async () => [{ referenced: Boolean(options.referenced) }]);
  const transaction = {
    $queryRaw: queryRaw,
    upload: {
      findFirst: vi.fn(async ({ where }: any) => (
        where.expiresAt?.gt && options.pending ? upload : null
      )),
      findMany: vi.fn(async () => [upload]),
      updateMany: vi.fn(async ({ data }: any) => {
        Object.assign(upload, data);
        return { count: 1 };
      }),
    },
    imageCleanupJob: {
      findUnique: vi.fn(async () => null),
      findFirst: vi.fn(async ({ where }: any) => {
        if (job.completedAt || job.nextAttemptAt > where.nextAttemptAt.lte) return null;
        if (!where.status.in.includes(job.status)) return null;
      if (where.fileKey?.in && !where.fileKey.in.includes(job.fileKey)) return null;
      if (where.fileKey?.notIn?.includes(job.fileKey)) return null;
      return job;
    }),
      update: vi.fn(async ({ data }: any) => {
        Object.assign(job, data);
        return job;
      }),
      upsert: vi.fn(async ({ create, update }: any) => {
        Object.assign(job, update ?? create);
        return job;
      }),
    },
  };
  const prisma = {
    $transaction: vi.fn(async (callback: (tx: typeof transaction) => unknown) => callback(transaction)),
  } as any;
  const storage: UploadStorage = {
    driver: 's3',
    storeFile: vi.fn(),
    readFile: vi.fn(),
    deleteFile: vi.fn(async () => undefined),
  };

  return { job, upload, transaction, prisma, storage, queryRaw, fileKey: fixtureFileKey };
}

describe('image cleanup lifecycle', () => {
  const originalGraceHours = process.env.UNATTACHED_UPLOAD_GRACE_HOURS;
  const originalStorageDriver = process.env.UPLOAD_STORAGE_DRIVER;
  const originalCleanupEnabled = process.env.IMAGE_CLEANUP_ENABLED;
  beforeEach(() => {
    process.env.UPLOAD_STORAGE_DRIVER = 's3';
    process.env.IMAGE_CLEANUP_ENABLED = 'true';
  });
  afterEach(() => {
    if (originalGraceHours === undefined) delete process.env.UNATTACHED_UPLOAD_GRACE_HOURS;
    else process.env.UNATTACHED_UPLOAD_GRACE_HOURS = originalGraceHours;
    if (originalStorageDriver === undefined) delete process.env.UPLOAD_STORAGE_DRIVER;
    else process.env.UPLOAD_STORAGE_DRIVER = originalStorageDriver;
    if (originalCleanupEnabled === undefined) delete process.env.IMAGE_CLEANUP_ENABLED;
    else process.env.IMAGE_CLEANUP_ENABLED = originalCleanupEnabled;
  });

  it('accepts only safe backend upload URLs as object keys', () => {
    expect(getManagedImageObjectKey(`/images/uploads/${fileKey}`)).toBe(fileKey);
    expect(getManagedImageObjectKey('/images/uploads/../private.png')).toBeNull();
    expect(getManagedImageObjectKey('https://untrusted.example/uploads/private.png')).toBeNull();
    expect(getManagedImageObjectKey(`/images/uploads/${fileKey}?download=1`)).toBeNull();
  });

  it('deletes an unreferenced object only after its durable job is marked deleting', async () => {
    const fixture = createLifecycleFixture();
    fixture.storage.deleteFile = vi.fn(async () => {
      expect(fixture.job.status).toBe('deleting');
    });

    const result = await processImageCleanupJobs(fixture.prisma, fixture.storage, undefined, { limit: 1 });

    expect(result.deleted).toBe(1);
    expect(fixture.storage.deleteFile).toHaveBeenCalledWith(fileKey);
    expect(fixture.upload.deletedAt).toBeInstanceOf(Date);
    expect(fixture.job.status).toBe('done');
    expect(fixture.job.completedAt).toBeInstanceOf(Date);
  });

  it.each(['local', 'unsupported-driver'])('refuses cleanup when the configured driver is %s', async (driver) => {
    const fixture = createLifecycleFixture();
    process.env.UPLOAD_STORAGE_DRIVER = driver;

    await expect(processImageCleanupJobs(fixture.prisma, fixture.storage)).rejects.toThrow(/S3\/R2 storage driver/);
    expect(fixture.prisma.$transaction).not.toHaveBeenCalled();
    expect(fixture.storage.deleteFile).not.toHaveBeenCalled();
  });

  it('refuses a local storage adapter even when configuration requests R2', async () => {
    const fixture = createLifecycleFixture();
    fixture.storage.driver = 'local';

    await expect(processImageCleanupJobs(fixture.prisma, fixture.storage)).rejects.toThrow(/S3\/R2 storage driver/);
    expect(fixture.prisma.$transaction).not.toHaveBeenCalled();
    expect(fixture.storage.deleteFile).not.toHaveBeenCalled();
  });

  it('keeps direct and scheduled cleanup disabled unless explicitly enabled', async () => {
    const fixture = createLifecycleFixture();
    delete process.env.IMAGE_CLEANUP_ENABLED;

    await expect(processImageCleanupJobs(fixture.prisma, fixture.storage)).rejects.toThrow(/IMAGE_CLEANUP_ENABLED/);
    await expect(runImageCleanupCycle(fixture.prisma, fixture.storage)).rejects.toThrow(/IMAGE_CLEANUP_ENABLED/);
    expect(fixture.prisma.$transaction).not.toHaveBeenCalled();
    expect(fixture.storage.deleteFile).not.toHaveBeenCalled();
  });

  it('refuses scheduled and request-triggered cleanup when R2 is not configured', async () => {
    const fixture = createLifecycleFixture();
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    process.env.UPLOAD_STORAGE_DRIVER = 'local';
    process.env.IMAGE_CLEANUP_ENABLED = 'true';

    await expect(runImageCleanupCycle(fixture.prisma, fixture.storage, logger)).rejects.toThrow(/S3\/R2 storage driver/);
    const drainResult = await drainImageCleanupQueue(fixture.prisma, logger);

    expect(drainResult.failed).toBe(1);
    expect(fixture.prisma.$transaction).not.toHaveBeenCalled();
    expect(fixture.storage.deleteFile).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it.each(['country', 'city', 'event'])('deletes a replaced unreferenced %s image', async () => {
    const fixture = createLifecycleFixture();

    const result = await processImageCleanupJobs(fixture.prisma, fixture.storage, undefined, { limit: 1 });

    expect(result.deleted).toBe(1);
    expect(fixture.storage.deleteFile).toHaveBeenCalledWith(fileKey);
  });

  it('keeps a shared image when another active record references it', async () => {
    const fixture = createLifecycleFixture({ referenced: true });

    const result = await processImageCleanupJobs(fixture.prisma, fixture.storage);

    expect(fixture.storage.deleteFile).not.toHaveBeenCalled();
    expect(fixture.job.status).toBe('done');
    expect(fixture.upload.attachedAt).toBeInstanceOf(Date);
    expect(result.retained).toBe(1);
  });

  it('keeps an identical old and new object key because it remains referenced', async () => {
    const fixture = createLifecycleFixture({ referenced: true });

    await processImageCleanupJobs(fixture.prisma, fixture.storage);

    expect(fixture.storage.deleteFile).not.toHaveBeenCalled();
  });

  it('does not delete an unattached upload during its configured grace period', async () => {
    process.env.UNATTACHED_UPLOAD_GRACE_HOURS = '2';
    const fixture = createLifecycleFixture({ pending: true });

    const result = await processImageCleanupJobs(fixture.prisma, fixture.storage, undefined, { limit: 1 });

    expect(fixture.storage.deleteFile).not.toHaveBeenCalled();
    expect(fixture.job.status).toBe('pending');
    expect(fixture.job.nextAttemptAt.getTime()).toBeGreaterThan(Date.now());
    expect(result.deleted).toBe(0);
  });

  it('expires unattached uploads using the configurable grace period', () => {
    process.env.UNATTACHED_UPLOAD_GRACE_HOURS = '6';
    const now = new Date('2026-10-31T00:00:00.000Z');

    expect(getUnattachedUploadExpiresAt(now).toISOString()).toBe('2026-10-31T06:00:00.000Z');
  });

  it('rejects invalid grace-period configuration explicitly', () => {
    process.env.UNATTACHED_UPLOAD_GRACE_HOURS = '0';

    expect(() => getUnattachedUploadExpiresAt()).toThrow(/UNATTACHED_UPLOAD_GRACE_HOURS/);
  });

  it('queues an old unattached upload for cleanup only after its grace period', async () => {
    process.env.UNATTACHED_UPLOAD_GRACE_HOURS = '1';
    const fixture = createLifecycleFixture();
    fixture.upload.createdAt = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const now = new Date();

    await enqueueExpiredUploads(fixture.prisma, now);

    expect(fixture.transaction.upload.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        attachedAt: null,
        deletedAt: null,
        OR: expect.arrayContaining([
          { expiresAt: { lte: now } },
          { expiresAt: null, createdAt: { lte: expect.any(Date) } },
        ]),
      }),
    }));
    expect(fixture.transaction.imageCleanupJob.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { fileKey },
    }));
  });

  it('deletes an expired abandoned upload after the configured grace period', async () => {
    process.env.UNATTACHED_UPLOAD_GRACE_HOURS = '1';
    const fixture = createLifecycleFixture();
    fixture.upload.createdAt = new Date(Date.now() - 2 * 60 * 60 * 1000);

    await enqueueExpiredUploads(fixture.prisma);
    const result = await processImageCleanupJobs(fixture.prisma, fixture.storage, undefined, { limit: 1 });

    expect(result.deleted).toBe(1);
    expect(fixture.storage.deleteFile).toHaveBeenCalledWith(fileKey);
  });

  it('never expires an unattached upload while a record still references it', async () => {
    process.env.UNATTACHED_UPLOAD_GRACE_HOURS = '1';
    const fixture = createLifecycleFixture({ referenced: true });
    fixture.upload.createdAt = new Date(Date.now() - 2 * 60 * 60 * 1000);

    await enqueueExpiredUploads(fixture.prisma);

    expect(fixture.transaction.imageCleanupJob.upsert).not.toHaveBeenCalled();
    expect(fixture.upload.attachedAt).toBeInstanceOf(Date);
  });

  it.each(['country', 'city', 'event'])('cleans an unreferenced image after %s record deletion', async () => {
    const fixture = createLifecycleFixture();

    const result = await processImageCleanupJobs(fixture.prisma, fixture.storage, undefined, { limit: 1 });

    expect(result.deleted).toBe(1);
    expect(fixture.storage.deleteFile).toHaveBeenCalledOnce();
  });

  it('persists retry state when R2 deletion fails', async () => {
    const fixture = createLifecycleFixture();
    fixture.storage.deleteFile = vi.fn().mockRejectedValueOnce(new Error('private credential material must not be logged'));
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

    const result = await processImageCleanupJobs(fixture.prisma, fixture.storage, logger, { limit: 1 });

    expect(result.failed).toBe(1);
    expect(fixture.job.status).toBe('deleting');
    expect(fixture.job.attempts).toBe(1);
    expect(fixture.job.lastError).not.toContain('credential');
    expect(logger.error).toHaveBeenCalled();

    fixture.job.nextAttemptAt = new Date(Date.now() - 1000);
    const retried = await processImageCleanupJobs(fixture.prisma, fixture.storage, logger, { limit: 1 });
    expect(retried.deleted).toBe(1);
    expect(fixture.storage.deleteFile).toHaveBeenCalledTimes(2);
    expect(fixture.job.status).toBe('done');
  });

  it('backs off in-process when retry state cannot be persisted', async () => {
    const fixture = createLifecycleFixture({ fileKey: 'test-user/uploads/retry-state-db-down.png' });
    fixture.storage.deleteFile = vi.fn().mockRejectedValue(new Error('temporary R2 failure'));
    fixture.prisma.$transaction.mockImplementationOnce(async (callback: (tx: typeof fixture.transaction) => unknown) => callback(fixture.transaction))
      .mockRejectedValueOnce(new Error('temporary database failure'));

    const result = await processImageCleanupJobs(fixture.prisma, fixture.storage, undefined, { limit: 10 });
    const retry = await processImageCleanupJobs(fixture.prisma, fixture.storage, undefined, { limit: 10 });

    expect(result.failed).toBe(1);
    expect(retry.processed).toBe(0);
    expect(fixture.storage.deleteFile).toHaveBeenCalledOnce();
    expect(fixture.transaction.imageCleanupJob.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ fileKey: { notIn: expect.arrayContaining([fixture.fileKey]) } }),
    }));
  });

  it('backs off in-process when cleanup completion cannot be persisted', async () => {
    const fixture = createLifecycleFixture({ fileKey: 'test-user/uploads/completion-state-db-down.png' });
    fixture.prisma.$transaction.mockImplementationOnce(async (callback: (tx: typeof fixture.transaction) => unknown) => callback(fixture.transaction))
      .mockRejectedValueOnce(new Error('temporary database failure'));

    const result = await processImageCleanupJobs(fixture.prisma, fixture.storage, undefined, { limit: 10 });
    const retry = await processImageCleanupJobs(fixture.prisma, fixture.storage, undefined, { limit: 10 });

    expect(result.failed).toBe(1);
    expect(retry.processed).toBe(0);
    expect(fixture.storage.deleteFile).toHaveBeenCalledOnce();
    expect(fixture.transaction.imageCleanupJob.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ fileKey: { notIn: expect.arrayContaining([fixture.fileKey]) } }),
    }));
  });

  it('queues failed-upload cleanup only for validated, internally generated URLs', async () => {
    const fixture = createLifecycleFixture();

    await enqueueOwnedImageCleanup(fixture.prisma, `/images/uploads/${fileKey}`);

    expect(fixture.transaction.imageCleanupJob.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { fileKey },
    }));
    await expect(enqueueOwnedImageCleanup(fixture.prisma, 'https://untrusted.example/object'))
      .rejects.toThrow(/validated application upload URLs/);
  });

  it('serializes reference changes against cleanup using the same advisory lock', () => {
    const migrationPath = path.resolve(__dirname, '../../prisma/migrations/20261031120000_add_image_cleanup_outbox/migration.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');

    expect(migration).toContain('pg_advisory_xact_lock(681729104331::BIGINT)');
    expect(migration).toContain(`"status" = 'deleting'`);
    for (const entity of ['Country', 'City', 'Event', 'User']) {
      expect(migration).toContain(`"${entity}_image_reference_lock_update"`);
      expect(migration).toContain(`"${entity}_image_reference_cleanup_update"`);
      expect(migration).toContain(`"${entity}_image_reference_cleanup_delete"`);
    }
  });

  it.each(['Country', 'City', 'Event'])('records %s image replacements and deletions in the outbox triggers', (entity) => {
    const migrationPath = path.resolve(__dirname, '../../prisma/migrations/20261031120000_add_image_cleanup_outbox/migration.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');

    expect(migration).toContain(`"${entity}_image_reference_cleanup_update"`);
    expect(migration).toContain(`"${entity}_image_reference_cleanup_delete"`);
    expect(migration).toContain('"enqueue_image_cleanup"(object_key)');
  });
});
