import { Prisma, PrismaClient } from '@prisma/client';
import { getUploadStorageDriver, type UploadStorage } from './upload-storage';

const IMAGE_LIFECYCLE_LOCK_ID = 681729104331;
const IMAGE_URL_PREFIX = '/images/uploads/';

export type ReplacementTarget = {
  entity: 'country' | 'city' | 'event' | 'user';
  entityId: string;
  field: 'heroImageUrl' | 'flagImageUrl' | 'image' | 'avatarUrl';
  previousUrl?: string | null;
  replacementUrl: string;
};

export class ImageReplacementError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = 'ImageReplacementError';
  }
}

export function getPrivateUploadObjectKey(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith(IMAGE_URL_PREFIX)) return null;
  const key = value.slice(IMAGE_URL_PREFIX.length);
  if (!key || !/^[A-Za-z0-9._/-]+$/.test(key)) return null;
  const segments = key.split('/');
  if (segments.length < 2 || segments.some((segment) => (
    !segment || segment === '.' || segment === '..' || !/^[A-Za-z0-9._-]+$/.test(segment)
  ))) return null;
  return key;
}

function assertPrivateObjectStorage(storage: UploadStorage) {
  if (getUploadStorageDriver() !== 's3' || storage.driver !== 's3') {
    throw new ImageReplacementError(
      'Permanent image deletion requires the configured private R2 storage.',
      'R2_REQUIRED',
      503,
    );
  }
}

function assertTarget(target: ReplacementTarget, actorId: string) {
  const fieldMatchesEntity = (
    (target.entity === 'country' && ['heroImageUrl', 'flagImageUrl'].includes(target.field))
    || (target.entity === 'city' && target.field === 'heroImageUrl')
    || (target.entity === 'event' && target.field === 'image')
    || (target.entity === 'user' && target.field === 'avatarUrl' && target.entityId === actorId)
  );
  if (!target.entityId || target.entityId.length > 200 || !fieldMatchesEntity) {
    throw new ImageReplacementError('Invalid image replacement target.', 'INVALID_TARGET', 400);
  }
}

function assertOwnedKey(fileKey: string, actorId: string) {
  if (!isOwnedKey(fileKey, actorId)) {
    throw new ImageReplacementError(
      'The previous image is not owned by the authenticated user.',
      'IMAGE_NOT_OWNED',
      403,
    );
  }
}

function isOwnedKey(fileKey: string, actorId: string) {
  const ownerSegment = actorId.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'upload';
  return fileKey.startsWith(`${ownerSegment}/`);
}

async function acquireImageLifecycleLock(transaction: Prisma.TransactionClient) {
  await transaction.$queryRaw(Prisma.sql`
    SELECT pg_advisory_xact_lock(${IMAGE_LIFECYCLE_LOCK_ID}::bigint)
  `);
}

async function targetReferencesReplacement(
  transaction: Prisma.TransactionClient,
  target: ReplacementTarget,
) {
  let rows: Array<{ matches: boolean }>;
  if (target.entity === 'country') {
    rows = await transaction.$queryRaw(Prisma.sql`
      SELECT EXISTS (
        SELECT 1 FROM "Country"
        WHERE "code" = ${target.entityId}
          AND "profile" ->> ${target.field} = ${target.replacementUrl}
      ) AS matches
    `);
  } else if (target.entity === 'city') {
    rows = await transaction.$queryRaw(Prisma.sql`
      SELECT EXISTS (
        SELECT 1 FROM "City"
        WHERE "slug" = ${target.entityId}
          AND "profile" ->> ${target.field} = ${target.replacementUrl}
      ) AS matches
    `);
  } else if (target.entity === 'event') {
    rows = await transaction.$queryRaw(Prisma.sql`
      SELECT EXISTS (
        SELECT 1 FROM "Event"
        WHERE "slug" = ${target.entityId}
          AND "image" = ${target.replacementUrl}
      ) AS matches
    `);
  } else {
    rows = await transaction.$queryRaw(Prisma.sql`
      SELECT EXISTS (
        SELECT 1 FROM "User"
        WHERE "id" = ${target.entityId}
          AND "avatarUrl" = ${target.replacementUrl}
      ) AS matches
    `);
  }
  return rows[0]?.matches === true;
}

async function isImageReferenced(transaction: Prisma.TransactionClient, fileKey: string) {
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
      SELECT 1 FROM "Event" WHERE "image" = ${`${IMAGE_URL_PREFIX}${fileKey}`}
      UNION ALL
      SELECT 1 FROM "User" WHERE "avatarUrl" = ${`${IMAGE_URL_PREFIX}${fileKey}`}
    ) AS referenced
  `);
  return rows[0]?.referenced === true;
}

async function getUploadMetadata(transaction: Prisma.TransactionClient, fileKey: string) {
  return transaction.$queryRaw<Array<{
    userId: string | null;
    url: string;
    deletedAt: Date | null;
  }>>(Prisma.sql`
    SELECT "userId", "url", "deletedAt"
    FROM "Upload"
    WHERE "fileKey" = ${fileKey}
    ORDER BY "createdAt" DESC
    LIMIT 1
  `);
}

async function getCleanupJob(transaction: Prisma.TransactionClient, fileKey: string) {
  return transaction.$queryRaw<Array<{
    status: string;
    completedAt: Date | null;
  }>>(Prisma.sql`
    SELECT "status", "completedAt"
    FROM "ImageCleanupJob"
    WHERE "fileKey" = ${fileKey}
    LIMIT 1
  `);
}

function isOwnedActiveUpload(
  upload: { userId: string | null; url: string; deletedAt: Date | null } | undefined,
  targetUrl: string,
  actorId: string,
) {
  return Boolean(upload && upload.userId === actorId && upload.url === targetUrl && upload.deletedAt === null);
}

function replacementBinding(target: ReplacementTarget, previousKey: string, replacementKey: string) {
  return JSON.stringify({
    entity: target.entity,
    entityId: target.entityId,
    field: target.field,
    previousKey,
    replacementKey,
  });
}

async function findReplacementBinding(
  transaction: Prisma.TransactionClient,
  actorId: string,
  binding: string,
  actions: string[],
) {
  return transaction.auditLog.findFirst({
    where: { userId: actorId, action: { in: actions }, meta: binding },
    select: { id: true, action: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function recordSavedImageReplacement(
  transaction: Prisma.TransactionClient,
  actorId: string,
  target: ReplacementTarget,
) {
  assertTarget(target, actorId);
  const previousKey = getPrivateUploadObjectKey(target.previousUrl);
  const replacementKey = getPrivateUploadObjectKey(target.replacementUrl);
  if (!previousKey || !replacementKey || previousKey === replacementKey) return false;
  if (!isOwnedKey(previousKey, actorId) || !isOwnedKey(replacementKey, actorId)) return false;

  await acquireImageLifecycleLock(transaction);
  if (!(await targetReferencesReplacement(transaction, target))) return false;

  const [previousUploads, replacementUploads, previousJobs, referenced] = await Promise.all([
    getUploadMetadata(transaction, previousKey),
    getUploadMetadata(transaction, replacementKey),
    getCleanupJob(transaction, previousKey),
    isImageReferenced(transaction, previousKey),
  ]);
  if (
    !isOwnedActiveUpload(previousUploads[0], target.previousUrl!, actorId)
    || !isOwnedActiveUpload(replacementUploads[0], target.replacementUrl, actorId)
    || previousJobs[0]?.status !== 'pending'
    || previousJobs[0].completedAt !== null
    || referenced
  ) return false;

  const binding = replacementBinding(target, previousKey, replacementKey);
  await transaction.auditLog.create({
    data: { userId: actorId, action: 'image-replacement-saved', meta: binding },
  });
  return true;
}

export async function verifyImageReplacement(
  prisma: PrismaClient,
  storage: UploadStorage,
  actorId: string,
  target: ReplacementTarget,
) {
  assertPrivateObjectStorage(storage);
  assertTarget(target, actorId);
  const replacementKey = getPrivateUploadObjectKey(target.replacementUrl);
  if (!replacementKey) {
    throw new ImageReplacementError('The replacement must use a private /images/uploads/ object path.', 'INVALID_REPLACEMENT', 400);
  }
  assertOwnedKey(replacementKey, actorId);

  const image = await storage.readFile(replacementKey);
  if (image.buffer.length === 0 || !image.contentType.toLowerCase().startsWith('image/')) {
    throw new ImageReplacementError('The replacement image could not be verified.', 'IMAGE_VERIFICATION_FAILED', 502);
  }

  return prisma.$transaction(async (transaction) => {
    await acquireImageLifecycleLock(transaction);
    if (!(await targetReferencesReplacement(transaction, target))) {
      throw new ImageReplacementError(
        'The saved record does not reference the replacement image.',
        'REPLACEMENT_NOT_SAVED',
        409,
      );
    }

    const replacementUploads = await getUploadMetadata(transaction, replacementKey);
    if (!isOwnedActiveUpload(replacementUploads[0], target.replacementUrl, actorId)) {
      throw new ImageReplacementError(
        'The replacement image upload could not be confirmed for this user.',
        'REPLACEMENT_UPLOAD_NOT_FOUND',
        409,
      );
    }

    const previousKey = getPrivateUploadObjectKey(target.previousUrl);
    if (!target.previousUrl) {
      return { verified: true, canDeletePrevious: false, reason: null };
    }
    if (!previousKey) {
      return { verified: true, canDeletePrevious: false, reason: 'The previous image is not a managed private upload.' };
    }
    if (previousKey === replacementKey) {
      return { verified: true, canDeletePrevious: false, reason: null };
    }
    if (!isOwnedKey(previousKey, actorId)) {
      return {
        verified: true,
        canDeletePrevious: false,
        reason: 'The previous image was uploaded by a different account and cannot be permanently deleted here.',
      };
    }

    const [previousUploads, previousJobs, referenced] = await Promise.all([
      getUploadMetadata(transaction, previousKey),
      getCleanupJob(transaction, previousKey),
      isImageReferenced(transaction, previousKey),
    ]);
    const previousUpload = previousUploads[0];
    const previousJob = previousJobs[0];
    let previousObjectExists = false;
    const binding = replacementBinding(target, previousKey, replacementKey);
    const savedReplacement = await findReplacementBinding(
      transaction,
      actorId,
      binding,
      ['image-replacement-saved'],
    );
    if (
      isOwnedActiveUpload(previousUpload, target.previousUrl!, actorId)
      && previousJob?.status === 'pending'
      && previousJob.completedAt === null
      && !referenced
      && savedReplacement
    ) {
      try {
        const previousImage = await storage.readFile(previousKey);
        previousObjectExists = previousImage.buffer.length > 0;
      } catch {
        previousObjectExists = false;
      }
    }
    const canDeletePrevious = isOwnedActiveUpload(previousUpload, target.previousUrl!, actorId)
      && previousJob?.status === 'pending'
      && previousJob.completedAt === null
      && !referenced
      && Boolean(savedReplacement)
      && previousObjectExists;
    return {
      verified: true,
      canDeletePrevious,
      reason: canDeletePrevious
        ? null
        : referenced
          ? 'The previous image is still referenced by another record and cannot be deleted.'
          : !previousObjectExists
            ? 'The previous image could not be confirmed in private object storage.'
          : 'The previous image is not eligible for permanent deletion.',
    };
  });
}

export async function deletePreviousImage(
  prisma: PrismaClient,
  storage: UploadStorage,
  actorId: string,
  target: ReplacementTarget,
) {
  assertPrivateObjectStorage(storage);
  assertTarget(target, actorId);
  const previousKey = getPrivateUploadObjectKey(target.previousUrl);
  const replacementKey = getPrivateUploadObjectKey(target.replacementUrl);
  if (!previousKey || !replacementKey || previousKey === replacementKey) {
    throw new ImageReplacementError('Only the exact private image replaced by this save can be deleted.', 'INVALID_IMAGE_KEY', 400);
  }
  assertOwnedKey(previousKey, actorId);
  assertOwnedKey(replacementKey, actorId);

  return prisma.$transaction(async (transaction) => {
    await acquireImageLifecycleLock(transaction);
    if (!(await targetReferencesReplacement(transaction, target))) {
      throw new ImageReplacementError(
        'The record no longer references this replacement. The previous image was not deleted.',
        'REPLACEMENT_CHANGED',
        409,
      );
    }

    const replacementUploads = await getUploadMetadata(transaction, replacementKey);
    if (!isOwnedActiveUpload(replacementUploads[0], target.replacementUrl, actorId)) {
      throw new ImageReplacementError(
        'The replacement image upload is no longer active. The previous image was not deleted.',
        'REPLACEMENT_UPLOAD_NOT_FOUND',
        409,
      );
    }
    try {
      const replacementImage = await storage.readFile(replacementKey);
      if (replacementImage.buffer.length === 0) throw new Error('Empty image');
    } catch {
      throw new ImageReplacementError(
        'The replacement image could not be retrieved. The previous image was not deleted.',
        'REPLACEMENT_UNAVAILABLE',
        409,
      );
    }

    const [previousUploads, previousJobs, referenced] = await Promise.all([
      getUploadMetadata(transaction, previousKey),
      getCleanupJob(transaction, previousKey),
      isImageReferenced(transaction, previousKey),
    ]);
    const previousUpload = previousUploads[0];
    const previousJob = previousJobs[0];
    if (referenced) {
      throw new ImageReplacementError(
        'The previous image is still referenced by another record and cannot be deleted.',
        'IMAGE_STILL_REFERENCED',
        409,
      );
    }
    const binding = replacementBinding(target, previousKey, replacementKey);
    const savedReplacement = await findReplacementBinding(
      transaction,
      actorId,
      binding,
      ['image-replacement-saved', 'image-replacement-deleted'],
    );
    if (!savedReplacement) {
      throw new ImageReplacementError(
        'The previous image was not associated with this saved replacement. It was not deleted.',
        'REPLACEMENT_NOT_ELIGIBLE',
        409,
      );
    }
    if (!previousUpload || previousUpload.userId !== actorId || previousUpload.url !== target.previousUrl) {
      throw new ImageReplacementError('The previous image is not owned by the authenticated user.', 'IMAGE_NOT_OWNED', 403);
    }
    if (previousUpload.deletedAt) {
      if (previousJob?.status !== 'done' || previousJob.completedAt === null) {
        throw new ImageReplacementError('Previous image deletion metadata is inconsistent.', 'IMAGE_STATE_INCONSISTENT', 409);
      }
      return { deleted: true, alreadyDeleted: true };
    }
    if (!previousJob || previousJob.status !== 'pending' || previousJob.completedAt !== null) {
      throw new ImageReplacementError(
        'The previous image is not linked to an eligible replacement.',
        'REPLACEMENT_NOT_ELIGIBLE',
        409,
      );
    }

    try {
      await storage.deleteFile(previousKey);
    } catch {
      throw new ImageReplacementError(
        'R2 did not confirm the previous image deletion. Its lifecycle record remains unchanged; retry is safe.',
        'R2_DELETE_FAILED',
        502,
      );
    }
    const now = new Date();
    const updatedUploads = await transaction.$executeRaw(Prisma.sql`
      UPDATE "Upload"
      SET "deletedAt" = ${now}, "expiresAt" = NULL
      WHERE "fileKey" = ${previousKey}
        AND "userId" = ${actorId}
        AND "url" = ${target.previousUrl}
        AND "deletedAt" IS NULL
    `);
    const updatedJobs = await transaction.$executeRaw(Prisma.sql`
      UPDATE "ImageCleanupJob"
      SET "status" = 'done',
          "completedAt" = ${now},
          "attempts" = 0,
          "lastError" = NULL
      WHERE "fileKey" = ${previousKey}
        AND "status" = 'pending'
        AND "completedAt" IS NULL
    `);
    if (updatedUploads < 1 || updatedJobs !== 1) {
      throw new ImageReplacementError(
        'The object was removed, but its lifecycle state could not be finalized. Retry the request safely.',
        'IMAGE_STATE_UPDATE_FAILED',
        500,
      );
    }
    const updatedBindings = await transaction.auditLog.updateMany({
      where: {
        userId: actorId,
        action: 'image-replacement-saved',
        meta: binding,
      },
      data: { action: 'image-replacement-deleted' },
    });
    if (updatedBindings.count < 1) {
      throw new ImageReplacementError(
        'The object was removed, but its replacement audit state could not be finalized. Retry the request safely.',
        'IMAGE_STATE_UPDATE_FAILED',
        500,
      );
    }
    return { deleted: true, alreadyDeleted: false };
  });
}
