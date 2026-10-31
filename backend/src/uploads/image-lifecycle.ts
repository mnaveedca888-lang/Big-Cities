import { Prisma, PrismaClient } from '@prisma/client';
import type { FastifyBaseLogger } from 'fastify';
import { createUploadStorage, getUploadStorageDriver, type UploadStorage } from './upload-storage';

const IMAGE_CLEANUP_LOCK_ID = 681729104331;
const DEFAULT_UPLOAD_GRACE_HOURS = 24;
const DEFAULT_CLEANUP_BATCH_SIZE = 50;
const MAX_RETRY_DELAY_MS = 6 * 60 * 60 * 1000;
const RETRY_STATE_FALLBACK_DELAY_MS = 60_000;
const retryStateUnavailableUntil = new Map<string, number>();

type LifecycleTransaction = Prisma.TransactionClient;

function getGracePeriodMs() {
  const rawHours = process.env.UNATTACHED_UPLOAD_GRACE_HOURS;
  if (rawHours === undefined || rawHours.trim() === '') {
    return DEFAULT_UPLOAD_GRACE_HOURS * 60 * 60 * 1000;
  }

  const hours = Number(rawHours);
  if (!Number.isFinite(hours) || hours < 1 || hours > 720) {
    throw new Error('UNATTACHED_UPLOAD_GRACE_HOURS must be a number from 1 to 720.');
  }
  return hours * 60 * 60 * 1000;
}

export function getUnattachedUploadExpiresAt(now = new Date()) {
  return new Date(now.getTime() + getGracePeriodMs());
}

export function getManagedImageObjectKey(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/images/uploads/')) return null;
  const encodedKey = value.slice('/images/uploads/'.length);
  if (!/^[A-Za-z0-9._/-]+$/.test(encodedKey)) return null;

  try {
    const segments = encodedKey.split('/').map(decodeURIComponent);
    if (segments.some((segment) => (
      !segment
      || segment === '.'
      || segment === '..'
      || segment.includes('/')
      || segment.includes('\\')
      || !/^[A-Za-z0-9._-]+$/.test(segment)
    ))) return null;
    return segments.join('/');
  } catch {
    return null;
  }
}

async function acquireImageLifecycleLock(transaction: LifecycleTransaction) {
  await transaction.$queryRaw(Prisma.sql`
    SELECT TRUE
    FROM (SELECT pg_advisory_xact_lock(${IMAGE_CLEANUP_LOCK_ID}::bigint)) AS lifecycle_lock
  `);
}

async function isImageReferenced(transaction: LifecycleTransaction, fileKey: string) {
  const rows = await transaction.$queryRaw<Array<{ referenced: boolean }>>(Prisma.sql`
    SELECT EXISTS (
      SELECT 1
      FROM "Country" AS country
      CROSS JOIN LATERAL "image_json_object_keys"(country."profile") AS image
      WHERE image.object_key = ${fileKey}
      UNION ALL
      SELECT 1
      FROM "City" AS city
      CROSS JOIN LATERAL "image_json_object_keys"(city."profile") AS image
      WHERE image.object_key = ${fileKey}
      UNION ALL
      SELECT 1 FROM "Event" WHERE "image" = ${`/images/uploads/${fileKey}`}
      UNION ALL
      SELECT 1 FROM "User" WHERE "avatarUrl" = ${`/images/uploads/${fileKey}`}
    ) AS referenced
  `);
  return rows[0]?.referenced === true;
}

async function enqueueCleanupJob(transaction: LifecycleTransaction, fileKey: string, now: Date) {
  const existing = await transaction.imageCleanupJob.findUnique({ where: { fileKey } });
  if (existing?.status === 'deleting') return { job: existing, scheduled: false };

  const job = await transaction.imageCleanupJob.upsert({
    where: { fileKey },
    create: { fileKey, nextAttemptAt: now },
    update: { status: 'pending', attempts: 0, completedAt: null, nextAttemptAt: now, lastError: null },
  });
  return { job, scheduled: true };
}

function safeStorageError(error: unknown) {
  const candidate = error as { name?: unknown; code?: unknown; $metadata?: { httpStatusCode?: unknown } };
  const name = typeof candidate?.name === 'string' && /^[A-Za-z0-9_]{1,60}$/.test(candidate.name)
    ? candidate.name
    : 'StorageError';
  const code = typeof candidate?.code === 'string' && /^(P\d{4}|[A-Z_]{1,40})$/.test(candidate.code)
    ? ` ${candidate.code}`
    : '';
  const status = candidate?.$metadata?.httpStatusCode;
  return `${name}${code}${typeof status === 'number' ? ` (HTTP ${status})` : ''}`;
}

function retryAt(attempt: number, now: Date) {
  const delay = Math.min(MAX_RETRY_DELAY_MS, 30_000 * (2 ** Math.min(attempt - 1, 10)));
  return new Date(now.getTime() + delay);
}

function assertR2CleanupDriver(storageDriver?: UploadStorage['driver']) {
  if (getUploadStorageDriver() !== 's3' || (storageDriver !== undefined && storageDriver !== 's3')) {
    throw new Error('Image cleanup requires the configured S3/R2 storage driver.');
  }
}

function assertCleanupEnabled() {
  if (process.env.IMAGE_CLEANUP_ENABLED !== 'true') {
    throw new Error('Image cleanup is disabled. Set IMAGE_CLEANUP_ENABLED=true to run cleanup.');
  }
}

export async function processImageCleanupJobs(
  prisma: PrismaClient,
  storage: UploadStorage = createUploadStorage(),
  logger?: Pick<FastifyBaseLogger, 'info' | 'warn' | 'error'>,
  options: { limit?: number; fileKeys?: string[] } = {},
) {
  assertCleanupEnabled();
  assertR2CleanupDriver(storage.driver);
  const limit = options.limit ?? DEFAULT_CLEANUP_BATCH_SIZE;
  const allowedKeys = options.fileKeys?.map(getManagedImageObjectKey).filter((key): key is string => key !== null);
  if (allowedKeys && allowedKeys.length === 0) return { deleted: 0, retained: 0, failed: 0, processed: 0 };

  const totals = { deleted: 0, retained: 0, failed: 0, processed: 0 };
  for (let index = 0; index < limit; index += 1) {
    const nowMs = Date.now();
    for (const [fileKey, retryAfter] of retryStateUnavailableUntil) {
      if (retryAfter <= nowMs) retryStateUnavailableUntil.delete(fileKey);
    }
    const blockedKeys = [...retryStateUnavailableUntil.keys()];
    const fileKeyFilter = {
      ...(allowedKeys ? { in: allowedKeys } : {}),
      ...(blockedKeys.length ? { notIn: blockedKeys } : {}),
    };
    let claim: { id: string; fileKey: string; attempts: number } | { outcome: 'retained' | 'deferred' } | null;
    try {
      claim = await prisma.$transaction(async (client) => {
        const transaction = client;
        await acquireImageLifecycleLock(transaction);
        const now = new Date();
        const job = await transaction.imageCleanupJob.findFirst({
          where: {
            completedAt: null,
            nextAttemptAt: { lte: now },
            status: { in: ['pending', 'deleting'] },
            ...(Object.keys(fileKeyFilter).length ? { fileKey: fileKeyFilter } : {}),
          },
          orderBy: [{ nextAttemptAt: 'asc' }, { createdAt: 'asc' }],
        });
        if (!job) return null;

        if (job.status !== 'deleting') {
          if (await isImageReferenced(transaction, job.fileKey)) {
            await transaction.upload.updateMany({
              where: { fileKey: job.fileKey, deletedAt: null },
              data: { attachedAt: now, expiresAt: null },
            });
            await transaction.imageCleanupJob.update({
              where: { id: job.id },
              data: { status: 'done', completedAt: now, lastError: null },
            });
            return { outcome: 'retained' };
          }

          const pending = await transaction.upload.findFirst({
            where: {
              fileKey: job.fileKey,
              attachedAt: null,
              deletedAt: null,
              expiresAt: { gt: now },
            },
            orderBy: { expiresAt: 'desc' },
          });
          if (pending?.expiresAt) {
            await transaction.imageCleanupJob.update({
              where: { id: job.id },
              data: { nextAttemptAt: pending.expiresAt },
            });
            return { outcome: 'deferred' };
          }

          await transaction.imageCleanupJob.update({
            where: { id: job.id },
            data: { status: 'deleting', nextAttemptAt: now },
          });
        }
        return { id: job.id, fileKey: job.fileKey, attempts: job.attempts };
      });
    } catch (error) {
      logger?.error({ error: safeStorageError(error) }, 'Image cleanup transaction failed');
      totals.failed += 1;
      break;
    }

    if (!claim) break;
    if ('outcome' in claim) {
      if (claim.outcome === 'retained') totals.retained += 1;
      totals.processed += 1;
      continue;
    }

    const deletingJob = claim;
    const now = new Date();
    try {
      await storage.deleteFile(deletingJob.fileKey);
    } catch (error) {
      const attempts = deletingJob.attempts + 1;
      const errorSummary = safeStorageError(error);
      try {
        await prisma.$transaction(async (client) => {
          const transaction = client;
          await acquireImageLifecycleLock(transaction);
          await transaction.imageCleanupJob.update({
            where: { id: deletingJob.id },
            data: {
              attempts,
              lastError: errorSummary,
              nextAttemptAt: retryAt(attempts, now),
            },
          });
        });
      } catch {
        retryStateUnavailableUntil.set(deletingJob.fileKey, Date.now() + RETRY_STATE_FALLBACK_DELAY_MS);
        logger?.error({ fileKey: deletingJob.fileKey, attempts }, 'Failed to persist image cleanup retry state');
      }
      logger?.error({ fileKey: deletingJob.fileKey, attempts, error: errorSummary }, 'Image cleanup failed; retry scheduled');
      totals.failed += 1;
      totals.processed += 1;
      continue;
    }

    try {
      await prisma.$transaction(async (client) => {
        const transaction = client;
        await acquireImageLifecycleLock(transaction);
        await transaction.upload.updateMany({
          where: { fileKey: deletingJob.fileKey, deletedAt: null },
          data: { deletedAt: new Date(), expiresAt: null },
        });
        await transaction.imageCleanupJob.update({
          where: { id: deletingJob.id },
          data: { status: 'done', completedAt: new Date(), lastError: null },
        });
      });
      retryStateUnavailableUntil.delete(deletingJob.fileKey);
      logger?.info({ fileKey: deletingJob.fileKey }, 'Unreferenced image object deleted');
      totals.deleted += 1;
    } catch (error) {
      retryStateUnavailableUntil.set(deletingJob.fileKey, Date.now() + RETRY_STATE_FALLBACK_DELAY_MS);
      logger?.error({ fileKey: deletingJob.fileKey, error: safeStorageError(error) }, 'Image was removed from storage but cleanup completion was not saved; deletion will be retried');
      totals.failed += 1;
    }
    totals.processed += 1;
  }
  return totals;
}

export async function enqueueOwnedImageCleanup(prisma: PrismaClient, value: unknown) {
  const fileKey = getManagedImageObjectKey(value);
  if (!fileKey) throw new Error('Only validated application upload URLs can be queued for cleanup.');
  return prisma.$transaction(async (client) => {
    const transaction = client;
    await acquireImageLifecycleLock(transaction);
    const { job } = await enqueueCleanupJob(transaction, fileKey, new Date());
    return job;
  });
}

export async function enqueueExpiredUploads(prisma: PrismaClient, now = new Date()) {
  const cutoff = new Date(now.getTime() - getGracePeriodMs());
  return prisma.$transaction(async (client) => {
    const transaction = client;
    await acquireImageLifecycleLock(transaction);
    const uploads = await transaction.upload.findMany({
      where: {
        attachedAt: null,
        deletedAt: null,
        OR: [
          { expiresAt: { lte: now } },
          { expiresAt: null, createdAt: { lte: cutoff } },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: DEFAULT_CLEANUP_BATCH_SIZE,
    });

    let enqueued = 0;
    for (const upload of uploads) {
      const fileKey = getManagedImageObjectKey(upload.url);
      if (!fileKey || fileKey !== upload.fileKey) continue;
      if (await isImageReferenced(transaction, fileKey)) {
        await transaction.upload.updateMany({
          where: { fileKey, deletedAt: null },
          data: { attachedAt: now, expiresAt: null },
        });
        continue;
      }
      const result = await enqueueCleanupJob(transaction, fileKey, now);
      if (result.scheduled) enqueued += 1;
    }
    return enqueued;
  });
}

export async function runImageCleanupCycle(
  prisma: PrismaClient,
  storage: UploadStorage = createUploadStorage(),
  logger?: Pick<FastifyBaseLogger, 'info' | 'warn' | 'error'>,
) {
  assertCleanupEnabled();
  assertR2CleanupDriver(storage.driver);
  const enqueued = await enqueueExpiredUploads(prisma);
  const processed = await processImageCleanupJobs(prisma, storage, logger);
  return { enqueued, ...processed };
}

export async function drainImageCleanupQueue(
  prisma: PrismaClient,
  logger?: Pick<FastifyBaseLogger, 'info' | 'warn' | 'error'>,
  fileKeys?: string[],
) {
  if (process.env.IMAGE_CLEANUP_ENABLED !== 'true') {
    return { deleted: 0, retained: 0, failed: 0, processed: 0 };
  }
  try {
    assertR2CleanupDriver();
  } catch (error) {
    logger?.error({ error: safeStorageError(error) }, 'Image cleanup refused because S3/R2 storage is not configured');
    return { deleted: 0, retained: 0, failed: 1, processed: 0 };
  }
  try {
    return await processImageCleanupJobs(prisma, createUploadStorage(), logger, { fileKeys });
  } catch (error) {
    logger?.error({ error: safeStorageError(error) }, 'Unable to start queued image cleanup');
    return { deleted: 0, retained: 0, failed: 1, processed: 0 };
  }
}

export function startImageCleanupWorker(prisma: PrismaClient, logger: FastifyBaseLogger) {
  if (process.env.IMAGE_CLEANUP_ENABLED !== 'true') {
    logger.info('Automatic image cleanup is disabled; queued cleanup jobs are retained.');
    return null;
  }
  if (getUploadStorageDriver() !== 's3') {
    logger.error('Automatic image cleanup requires the configured S3/R2 storage driver.');
    return null;
  }

  const storage = createUploadStorage();
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      const result = await runImageCleanupCycle(prisma, storage, logger);
      if (result.enqueued || result.processed) logger.info(result, 'Image cleanup cycle completed');
    } catch (error) {
      logger.error({ error: safeStorageError(error) }, 'Image cleanup cycle failed');
    } finally {
      running = false;
    }
  };
  const timer = setInterval(() => { void run(); }, 60_000);
  timer.unref?.();
  void run();
  return () => clearInterval(timer);
}
