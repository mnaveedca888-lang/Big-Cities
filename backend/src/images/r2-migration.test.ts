import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildMigrationPlan,
  parseInventoryCsv,
  runMigrationWorkflow,
  type MigrationObjectStore,
} from './r2-migration';

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'r2-migration-'));
  tempDirs.push(dir);
  return dir;
}

function inventoryLine(filePath: string, buffer: Buffer, extra = ',,'): string {
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  return `${filePath},${buffer.length},${sha256}${extra},not_copied`;
}

function writeInventory(dir: string, rows: string[]): string {
  const inventoryPath = path.join(dir, 'inventory.csv');
  fs.writeFileSync(
    inventoryPath,
    ['repository_path,bytes,sha256,duplicate_group_sha256,duplicate_of_path,r2_status', ...rows].join('\n'),
  );
  return inventoryPath;
}

afterEach(() => {
  vi.restoreAllMocks();
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('R2 migration workflow', () => {
  it('parses quoted CSV fields and maps inventory entries to deterministic keys', async () => {
    const dir = makeTempDir();
    const imagePath = 'backend/public/Images/city photos/city.webp';
    const sourcePath = path.join(dir, imagePath);
    const image = Buffer.from('image-payload');
    fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
    fs.writeFileSync(sourcePath, image);

    const rows = parseInventoryCsv([
      'repository_path,bytes,sha256,duplicate_group_sha256,duplicate_of_path,r2_status',
      `"${imagePath}",${image.length},${crypto.createHash('sha256').update(image).digest('hex')},,,not_copied`,
    ].join('\n'));
    const plan = await buildMigrationPlan(rows, dir, 10);
    const repeatedPlan = await buildMigrationPlan(rows, dir, 10);

    expect(plan.pending).toBe(1);
    expect(plan.items[0].objectKey).toBe(repeatedPlan.items[0].objectKey);
    expect(plan.items[0].objectKey).toMatch(/^images\/city-photos\/city-[a-f0-9]{16}\.webp$/);
  });

  it('reports absent sources and checksum mismatches without touching storage', async () => {
    const dir = makeTempDir();
    const actual = Buffer.from('actual-image');
    fs.writeFileSync(path.join(dir, 'wrong.png'), actual);
    const badHash = 'a'.repeat(64);
    const missingHash = 'b'.repeat(64);
    const inventoryPath = writeInventory(dir, [
      `wrong.png,${actual.length},${badHash},,,not_copied`,
      `missing.png,0,${missingHash},,,not_copied`,
    ]);

    const report = await runMigrationWorkflow(inventoryPath, dir, { dryRun: true });
    expect(report.checksumMismatches).toBe(1);
    expect(report.missingSources).toBe(1);
    expect(report.migrated).toBe(0);
  });

  it('maps duplicate entries to the canonical object key, not every hash group member', async () => {
    const dir = makeTempDir();
    const image = Buffer.from('same-image');
    fs.writeFileSync(path.join(dir, 'first.webp'), image);
    fs.writeFileSync(path.join(dir, 'duplicate.webp'), image);
    const hash = crypto.createHash('sha256').update(image).digest('hex');
    const inventoryPath = writeInventory(dir, [
      `first.webp,${image.length},${hash},${hash},,not_copied`,
      `duplicate.webp,${image.length},${hash},${hash},first.webp,not_copied`,
    ]);

    const report = await runMigrationWorkflow(inventoryPath, dir, { dryRun: true, batchSize: 1 });
    expect(report.pending).toBe(1);
    expect(report.duplicates).toBe(1);
    expect(report.items[1].objectKey).toBe(report.items[0].objectKey);
    expect(report.batchCount).toBe(2);
  });

  it('verifies existing objects and refuses to overwrite a mismatching object', async () => {
    const dir = makeTempDir();
    const image = Buffer.from('expected');
    fs.writeFileSync(path.join(dir, 'image.png'), image);
    const inventoryPath = writeInventory(dir, [inventoryLine('image.png', image)]);
    const correctStore: MigrationObjectStore = {
      readObject: vi.fn().mockResolvedValue(image),
      putObjectIfAbsent: vi.fn(),
    };
    const report = await runMigrationWorkflow(inventoryPath, dir, { dryRun: true, store: correctStore });
    expect(report.alreadyMigrated).toBe(1);
    expect(correctStore.putObjectIfAbsent).not.toHaveBeenCalled();

    const mismatchingStore: MigrationObjectStore = {
      readObject: vi.fn().mockResolvedValue(Buffer.from('different')),
      putObjectIfAbsent: vi.fn(),
    };
    const mismatch = await runMigrationWorkflow(inventoryPath, dir, { dryRun: true, store: mismatchingStore });
    expect(mismatch.failed).toBe(1);
    expect(mismatchingStore.putObjectIfAbsent).not.toHaveBeenCalled();
  });

  it('retries transient object reads and can safely rescan after an interrupted run', async () => {
    const dir = makeTempDir();
    const first = Buffer.from('first');
    const second = Buffer.from('second');
    fs.writeFileSync(path.join(dir, 'first.png'), first);
    fs.writeFileSync(path.join(dir, 'second.png'), second);
    const inventoryPath = writeInventory(dir, [
      inventoryLine('first.png', first),
      inventoryLine('second.png', second),
    ]);
    const store: MigrationObjectStore = {
      readObject: vi.fn()
        .mockRejectedValueOnce(new Error('temporary'))
        .mockResolvedValue(null),
      putObjectIfAbsent: vi.fn(),
    };

    const report = await runMigrationWorkflow(inventoryPath, dir, {
      dryRun: true,
      batchSize: 1,
      store,
    });
    expect(store.readObject).toHaveBeenCalledTimes(3);
    expect(report.items[0].status).toBe('pending');
    expect(report.items[1].status).toBe('pending');
    expect(report.databaseReferencesVerified).toBe(false);
    expect(report.unresolvedDatabaseReferences).toBeNull();
  });

  it('writes only with the explicit guard and verifies idempotently on rerun', async () => {
    const dir = makeTempDir();
    const image = Buffer.from('safe test image');
    fs.writeFileSync(path.join(dir, 'image.png'), image);
    const inventoryPath = writeInventory(dir, [inventoryLine('image.png', image)]);
    const stored = new Map<string, Buffer>();
    const store: MigrationObjectStore = {
      readObject: vi.fn(async (key) => stored.get(key) ?? null),
      putObjectIfAbsent: vi.fn(async (key, buffer) => {
        if (stored.has(key)) throw new Error('precondition failed');
        stored.set(key, Buffer.from(buffer));
      }),
    };
    const previousGuard = process.env.ALLOW_R2_MIGRATION;
    process.env.ALLOW_R2_MIGRATION = 'true';
    try {
      const firstRun = await runMigrationWorkflow(inventoryPath, dir, {
        dryRun: false,
        execute: true,
        batchIndex: 0,
        store,
      });
      const resumedRun = await runMigrationWorkflow(inventoryPath, dir, {
        dryRun: false,
        execute: true,
        batchIndex: 0,
        store,
      });
      expect(firstRun.migrated).toBe(1);
      expect(firstRun.alreadyMigrated).toBe(0);
      expect(resumedRun.migrated).toBe(0);
      expect(resumedRun.alreadyMigrated).toBe(1);
      expect(store.putObjectIfAbsent).toHaveBeenCalledTimes(1);
    } finally {
      if (previousGuard === undefined) delete process.env.ALLOW_R2_MIGRATION;
      else process.env.ALLOW_R2_MIGRATION = previousGuard;
    }
  });

  it('requires the explicit migration guard before write mode', async () => {
    const dir = makeTempDir();
    const image = Buffer.from('image');
    fs.writeFileSync(path.join(dir, 'image.png'), image);
    const inventoryPath = writeInventory(dir, [inventoryLine('image.png', image)]);
    delete process.env.ALLOW_R2_MIGRATION;

    await expect(runMigrationWorkflow(inventoryPath, dir, {
      dryRun: false,
      execute: true,
      batchIndex: 0,
      store: { readObject: vi.fn(), putObjectIfAbsent: vi.fn() },
    })).rejects.toThrow(/ALLOW_R2_MIGRATION/);
  });

  it('executes only the explicitly selected batch', async () => {
    const dir = makeTempDir();
    const first = Buffer.from('first image');
    const second = Buffer.from('second image');
    fs.writeFileSync(path.join(dir, 'first.png'), first);
    fs.writeFileSync(path.join(dir, 'second.png'), second);
    const inventoryPath = writeInventory(dir, [
      inventoryLine('first.png', first),
      inventoryLine('second.png', second),
    ]);
    const stored = new Map<string, Buffer>();
    const store: MigrationObjectStore = {
      readObject: vi.fn(async (key) => stored.get(key) ?? null),
      putObjectIfAbsent: vi.fn(async (key, buffer) => {
        stored.set(key, Buffer.from(buffer));
      }),
    };
    const previousGuard = process.env.ALLOW_R2_MIGRATION;
    process.env.ALLOW_R2_MIGRATION = 'true';
    try {
      const report = await runMigrationWorkflow(inventoryPath, dir, {
        dryRun: false,
        execute: true,
        batchSize: 1,
        batchIndex: 1,
        store,
      });

      expect(report.selectedBatchIndex).toBe(1);
      expect(report.items[0].status).toBe('pending');
      expect(report.items[1].status).toBe('migrated');
      expect(store.putObjectIfAbsent).toHaveBeenCalledTimes(1);
      expect(store.putObjectIfAbsent).toHaveBeenCalledWith(
        report.items[1].objectKey,
        second,
        'image/png',
      );
    } finally {
      if (previousGuard === undefined) delete process.env.ALLOW_R2_MIGRATION;
      else process.env.ALLOW_R2_MIGRATION = previousGuard;
    }
  });

  it('rejects write execution without an explicit batch index', async () => {
    const dir = makeTempDir();
    const image = Buffer.from('image');
    fs.writeFileSync(path.join(dir, 'image.png'), image);
    const inventoryPath = writeInventory(dir, [inventoryLine('image.png', image)]);
    const previousGuard = process.env.ALLOW_R2_MIGRATION;
    process.env.ALLOW_R2_MIGRATION = 'true';
    try {
      await expect(runMigrationWorkflow(inventoryPath, dir, {
        dryRun: false,
        execute: true,
        store: { readObject: vi.fn(), putObjectIfAbsent: vi.fn() },
      })).rejects.toThrow(/explicit batch index/);
    } finally {
      if (previousGuard === undefined) delete process.env.ALLOW_R2_MIGRATION;
      else process.env.ALLOW_R2_MIGRATION = previousGuard;
    }
  });
});
