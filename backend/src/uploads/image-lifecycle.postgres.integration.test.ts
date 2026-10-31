import { spawn, spawnSync } from 'child_process';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { enqueueExpiredUploads, enqueueOwnedImageCleanup, processImageCleanupJobs } from './image-lifecycle';
import type { UploadStorage } from './upload-storage';

const TEST_DATABASE_NAME = 'big_cities_image_lifecycle_test';
const TEST_DATABASE_URL = process.env.IMAGE_LIFECYCLE_TEST_DATABASE_URL;
const PSQL_PATH = process.env.PSQL_PATH || 'psql';
const suite = TEST_DATABASE_URL ? describe : describe.skip;

const baselineSql = `
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
CREATE TABLE "Upload" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "fileKey" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "type" TEXT,
  "size" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "Country" ("code" TEXT PRIMARY KEY, "profile" JSONB);
CREATE TABLE "City" ("slug" TEXT PRIMARY KEY, "profile" JSONB);
CREATE TABLE "Event" ("id" TEXT PRIMARY KEY, "image" TEXT);
CREATE TABLE "User" ("id" TEXT PRIMARY KEY, "avatarUrl" TEXT);
`;

function getLocalPsqlEnvironment(databaseUrl: string, applicationName?: string) {
  const parsed = new URL(databaseUrl);
  const databaseName = decodeURIComponent(parsed.pathname.slice(1));
  if (!['localhost', '127.0.0.1', '::1'].includes(parsed.hostname) || databaseName !== TEST_DATABASE_NAME) {
    throw new Error(`PostgreSQL integration tests only accept localhost database ${TEST_DATABASE_NAME}.`);
  }
  return {
    ...process.env,
    PGHOST: parsed.hostname,
    PGPORT: parsed.port || '5432',
    PGUSER: decodeURIComponent(parsed.username),
    PGPASSWORD: decodeURIComponent(parsed.password),
    PGDATABASE: databaseName,
    PGSSLMODE: 'disable',
    ...(applicationName ? { PGAPPNAME: applicationName } : {}),
  };
}

function runPsql(sql: string, applicationName?: string) {
  if (!TEST_DATABASE_URL) throw new Error('IMAGE_LIFECYCLE_TEST_DATABASE_URL is required.');
  const env = getLocalPsqlEnvironment(TEST_DATABASE_URL, applicationName);
  const result = spawnSync(PSQL_PATH, ['-X', '-v', 'ON_ERROR_STOP=1', '-A', '-t', '-c', sql], {
    env,
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.error) throw result.error;
  return { status: result.status, stdout: result.stdout.trim(), stderr: result.stderr.trim() };
}

function runPsqlFile(filePath: string) {
  if (!TEST_DATABASE_URL) throw new Error('IMAGE_LIFECYCLE_TEST_DATABASE_URL is required.');
  const result = spawnSync(PSQL_PATH, ['-X', '-v', 'ON_ERROR_STOP=1', '-f', filePath], {
    env: getLocalPsqlEnvironment(TEST_DATABASE_URL),
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`psql migration failed: ${result.stderr}`);
}

function startPsql(sql: string, applicationName: string) {
  if (!TEST_DATABASE_URL) throw new Error('IMAGE_LIFECYCLE_TEST_DATABASE_URL is required.');
  const child = spawn(PSQL_PATH, ['-X', '-v', 'ON_ERROR_STOP=1', '-A', '-t', '-c', sql], {
    env: getLocalPsqlEnvironment(TEST_DATABASE_URL, applicationName),
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8').on('data', (chunk: string) => { stdout += chunk; });
  child.stderr.setEncoding('utf8').on('data', (chunk: string) => { stderr += chunk; });
  const completed = new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code) => resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() }));
  });
  return { child, completed };
}

async function waitForPsqlActivity(applicationName: string, predicate: (output: string) => boolean) {
  const deadline = Date.now() + 8_000;
  while (Date.now() < deadline) {
    const result = runPsql(
      `SELECT count(*) FROM pg_stat_activity WHERE application_name = '${applicationName}' AND state = 'active'`,
    );
    if (result.status === 0 && predicate(result.stdout)) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out waiting for PostgreSQL session ${applicationName}.`);
}

function createMockStorage() {
  const deletedKeys: string[] = [];
  const storage: UploadStorage = {
    driver: 's3',
    storeFile: async () => { throw new Error('Integration test storage is read-only.'); },
    readFile: async () => { throw new Error('Integration test storage is read-only.'); },
    deleteFile: async (key) => { deletedKeys.push(key); },
  };
  return { storage, deletedKeys };
}

suite('image cleanup PostgreSQL migration integration', () => {
  let prisma: PrismaClient;
  const originalStorageDriver = process.env.UPLOAD_STORAGE_DRIVER;
  const originalCleanupEnabled = process.env.IMAGE_CLEANUP_ENABLED;

  beforeAll(async () => {
    if (!TEST_DATABASE_URL) throw new Error('IMAGE_LIFECYCLE_TEST_DATABASE_URL is required.');
    const env = getLocalPsqlEnvironment(TEST_DATABASE_URL);
    const setup = spawnSync(PSQL_PATH, ['-X', '-v', 'ON_ERROR_STOP=1', '-A', '-t', '-c', baselineSql], {
      env,
      encoding: 'utf8',
      windowsHide: true,
    });
    if (setup.error) throw setup.error;
    if (setup.status !== 0) throw new Error(`PostgreSQL test schema setup failed: ${setup.stderr}`);
    const timezone = runPsql(`ALTER DATABASE "${TEST_DATABASE_NAME}" SET timezone TO 'UTC'`);
    if (timezone.status !== 0) throw new Error(`PostgreSQL test timezone setup failed: ${timezone.stderr}`);

    const migrationPath = path.resolve(__dirname, '../../prisma/migrations/20261031120000_add_image_cleanup_outbox/migration.sql');
    runPsqlFile(migrationPath);
    prisma = new PrismaClient({ datasources: { db: { url: TEST_DATABASE_URL } } });
    await prisma.$connect();
    process.env.UPLOAD_STORAGE_DRIVER = 's3';
    process.env.IMAGE_CLEANUP_ENABLED = 'true';
  }, 30_000);

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Country", "City", "Event", "User", "Upload", "ImageCleanupJob"');
  });

  afterAll(async () => {
    await prisma?.$disconnect();
    if (originalStorageDriver === undefined) delete process.env.UPLOAD_STORAGE_DRIVER;
    else process.env.UPLOAD_STORAGE_DRIVER = originalStorageDriver;
    if (originalCleanupEnabled === undefined) delete process.env.IMAGE_CLEANUP_ENABLED;
    else process.env.IMAGE_CLEANUP_ENABLED = originalCleanupEnabled;
  });

  it('applies the real migration and cleans a replaced image only after its reference commits', async () => {
    const oldKey = 'integration/replacement-old.png';
    const newKey = 'integration/replacement-new.png';
    runPsql(`
      INSERT INTO "Upload" ("id", "fileKey", "url") VALUES
        ('upload-replacement-old', '${oldKey}', '/images/uploads/${oldKey}'),
        ('upload-replacement-new', '${newKey}', '/images/uploads/${newKey}');
      INSERT INTO "Country" ("code", "profile") VALUES ('ZZ', '{"heroImageUrl":"/images/uploads/${oldKey}"}');
      UPDATE "Country" SET "profile" = '{"heroImageUrl":"/images/uploads/${newKey}"}' WHERE "code" = 'ZZ';
    `);

    const oldJob = await prisma.imageCleanupJob.findUnique({ where: { fileKey: oldKey } });
    expect(oldJob?.status).toBe('pending');
    const { storage, deletedKeys } = createMockStorage();
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    const result = await processImageCleanupJobs(prisma, storage, logger, { limit: 1 });

    expect(result.deleted, JSON.stringify(logger.error.mock.calls)).toBe(1);
    expect(deletedKeys).toEqual([oldKey]);
    expect(JSON.parse(runPsql(`SELECT "profile"::text FROM "Country" WHERE "code" = 'ZZ'`).stdout)).toEqual({
      heroImageUrl: `/images/uploads/${newKey}`,
    });
  });

  it('retains shared references across country, city, event, and user records', async () => {
    const sharedKey = 'integration/shared-image.png';
    const replacementKey = 'integration/country-new.png';
    runPsql(`
      INSERT INTO "Upload" ("id", "fileKey", "url") VALUES
        ('upload-shared', '${sharedKey}', '/images/uploads/${sharedKey}'),
        ('upload-country-new', '${replacementKey}', '/images/uploads/${replacementKey}');
      INSERT INTO "Country" ("code", "profile") VALUES ('ZZ', '{"flagImageUrl":"/images/uploads/${sharedKey}"}');
      INSERT INTO "City" ("slug", "profile") VALUES ('shared-city', '{"heroImageUrl":"/images/uploads/${sharedKey}"}');
      INSERT INTO "Event" ("id", "image") VALUES ('shared-event', '/images/uploads/${sharedKey}');
      INSERT INTO "User" ("id", "avatarUrl") VALUES ('shared-user', '/images/uploads/${sharedKey}');
      UPDATE "Country" SET "profile" = '{"flagImageUrl":"/images/uploads/${replacementKey}"}' WHERE "code" = 'ZZ';
    `);

    const { storage, deletedKeys } = createMockStorage();
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    const retained = await processImageCleanupJobs(prisma, storage, logger, { limit: 1 });
    expect(retained.retained).toBe(1);
    expect(deletedKeys).toEqual([]);

    runPsql(`
      UPDATE "City" SET "profile" = NULL WHERE "slug" = 'shared-city';
      UPDATE "Event" SET "image" = NULL WHERE "id" = 'shared-event';
      UPDATE "User" SET "avatarUrl" = NULL WHERE "id" = 'shared-user';
    `);
    const deleted = await processImageCleanupJobs(prisma, storage, undefined, { limit: 1 });
    expect(deleted.deleted).toBe(1);
    expect(deletedKeys).toEqual([sharedKey]);
  });

  it('rolls back image reference changes and their cleanup outbox jobs together', async () => {
    const oldKey = 'integration/rollback-old.png';
    const newKey = 'integration/rollback-new.png';
    runPsql(`
      INSERT INTO "Upload" ("id", "fileKey", "url") VALUES
        ('upload-rollback-old', '${oldKey}', '/images/uploads/${oldKey}'),
        ('upload-rollback-new', '${newKey}', '/images/uploads/${newKey}');
      INSERT INTO "Country" ("code", "profile") VALUES ('ZZ', '{"heroImageUrl":"/images/uploads/${oldKey}"}');
    `);

    await expect(prisma.$transaction(async (transaction) => {
      await transaction.$executeRawUnsafe(
        `UPDATE "Country" SET "profile" = '{"heroImageUrl":"/images/uploads/${newKey}"}' WHERE "code" = 'ZZ'`,
      );
      throw new Error('force rollback');
    })).rejects.toThrow('force rollback');

    expect(JSON.parse(runPsql(`SELECT "profile"::text FROM "Country" WHERE "code" = 'ZZ'`).stdout)).toEqual({
      heroImageUrl: `/images/uploads/${oldKey}`,
    });
    expect(await prisma.imageCleanupJob.findUnique({ where: { fileKey: oldKey } })).toBeNull();
  });

  it('keeps unattached upload metadata protected during its grace period', async () => {
    const fileKey = 'integration/active-upload-session.png';
    runPsql(`
      INSERT INTO "Upload" ("id", "fileKey", "url", "expiresAt")
      VALUES ('upload-active-session', '${fileKey}', '/images/uploads/${fileKey}', CURRENT_TIMESTAMP + INTERVAL '1 hour');
      INSERT INTO "ImageCleanupJob" ("id", "fileKey")
      VALUES ('cleanup-active-session', '${fileKey}');
    `);

    const { storage, deletedKeys } = createMockStorage();
    const result = await processImageCleanupJobs(prisma, storage, undefined, { limit: 1 });
    const job = await prisma.imageCleanupJob.findUnique({ where: { fileKey } });

    expect(result.deleted).toBe(0);
    expect(deletedKeys).toEqual([]);
    expect(job?.status).toBe('pending');
    expect(job?.nextAttemptAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('does not reopen a deleting job through application or SQL enqueue paths', async () => {
    const fileKey = 'integration/deleting-image.png';
    runPsql(`
      INSERT INTO "Upload" ("id", "fileKey", "url", "expiresAt")
      VALUES ('upload-deleting', '${fileKey}', '/images/uploads/${fileKey}', CURRENT_TIMESTAMP - INTERVAL '1 hour');
      INSERT INTO "ImageCleanupJob" ("id", "fileKey", "status")
      VALUES ('cleanup-deleting', '${fileKey}', 'deleting');
      SELECT "enqueue_image_cleanup"('${fileKey}');
    `);

    expect(await enqueueExpiredUploads(prisma)).toBe(0);
    await enqueueOwnedImageCleanup(prisma, `/images/uploads/${fileKey}`);

    const job = await prisma.imageCleanupJob.findUnique({ where: { fileKey } });
    expect(job?.status).toBe('deleting');
    const attemptedReference = runPsql(
      `INSERT INTO "Country" ("code", "profile") VALUES ('ZZ', '{"heroImageUrl":"/images/uploads/${fileKey}"}')`,
    );
    expect(attemptedReference.status).not.toBe(0);
    expect(attemptedReference.stderr).toContain('Cannot reference an image while its cleanup is in progress');
  });

  it('protects against a concurrent reference writer waiting on the cleanup advisory lock', async () => {
    const oldKey = 'integration/concurrent-image.png';
    runPsql(`
      INSERT INTO "Upload" ("id", "fileKey", "url") VALUES ('upload-concurrent', '${oldKey}', '/images/uploads/${oldKey}');
      INSERT INTO "Country" ("code", "profile") VALUES ('ZZ', '{"heroImageUrl":"/images/uploads/${oldKey}"}');
      UPDATE "Country" SET "profile" = NULL WHERE "code" = 'ZZ';
    `);

    const holder = startPsql(
      `BEGIN; SELECT pg_advisory_xact_lock(681729104331::bigint); SELECT pg_sleep(1.5); UPDATE "ImageCleanupJob" SET status = 'deleting' WHERE "fileKey" = '${oldKey}'; COMMIT;`,
      'image-lifecycle-lock-holder',
    );
    await waitForPsqlActivity('image-lifecycle-lock-holder', (output) => Number(output) > 0);

    const writer = startPsql(
      `INSERT INTO "City" ("slug", "profile") VALUES ('concurrent-reference', '{"heroImageUrl":"/images/uploads/${oldKey}"}'::jsonb);`,
      'image-lifecycle-reference-writer',
    );
    const waitingDeadline = Date.now() + 8_000;
    let isWaiting = false;
    while (Date.now() < waitingDeadline) {
      const locks = runPsql(
        `SELECT count(*) FROM pg_locks WHERE locktype = 'advisory' AND NOT granted AND pid = (SELECT pid FROM pg_stat_activity WHERE application_name = 'image-lifecycle-reference-writer')`,
      );
      if (locks.status === 0 && Number(locks.stdout) > 0) {
        isWaiting = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    const [holderResult, writerResult] = await Promise.all([holder.completed, writer.completed]);
    expect(isWaiting).toBe(true);
    expect(holderResult.code).toBe(0);
    expect(writerResult.code).not.toBe(0);
    expect(writerResult.stderr).toContain('Cannot reference an image while its cleanup is in progress');
    expect(runPsql(`SELECT count(*) FROM "City" WHERE "slug" = 'concurrent-reference'`).stdout).toBe('0');
  }, 20_000);
});
