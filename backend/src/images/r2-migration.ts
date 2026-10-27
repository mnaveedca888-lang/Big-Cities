import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export type InventoryEntry = {
  repository_path: string;
  bytes: number;
  sha256: string;
  duplicate_group_sha256: string;
  duplicate_of_path?: string;
  r2_status: string;
};

export type MigrationStatus =
  | 'pending'
  | 'migrated'
  | 'already_migrated'
  | 'duplicate'
  | 'checksum_mismatch'
  | 'missing_source'
  | 'failed';

export type MigrationItem = {
  repositoryPath: string;
  sourcePath: string;
  objectKey: string;
  expectedBytes: number;
  expectedSha256: string;
  duplicateOf?: string;
  status: MigrationStatus;
  reason: string;
  actualBytes?: number;
  actualSha256?: string;
  batchIndex: number;
};

export type MigrationReport = {
  dryRun: boolean;
  totalEntries: number;
  pending: number;
  migrated: number;
  alreadyMigrated: number;
  duplicates: number;
  checksumMismatches: number;
  missingSources: number;
  failed: number;
  databaseReferencesVerified: boolean;
  unresolvedDatabaseReferences: number | null;
  batchCount: number;
  batches: number[];
  items: MigrationItem[];
};

export type MigrationObjectStore = {
  readObject(key: string): Promise<Buffer | null>;
  putObjectIfAbsent(key: string, buffer: Buffer, contentType: string): Promise<void>;
};

function imageContentType(sourcePath: string): string {
  const contentTypes: Record<string, string> = {
    '.avif': 'image/avif',
    '.bmp': 'image/bmp',
    '.gif': 'image/gif',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
  };
  return contentTypes[path.extname(sourcePath).toLowerCase()] ?? 'application/octet-stream';
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      values.push(value.trim());
      value = '';
    } else {
      value += character;
    }
  }

  if (quoted) throw new Error('Inventory CSV contains an unterminated quoted field.');
  values.push(value.trim());
  return values;
}

export function parseInventoryCsv(csvText: string): InventoryEntry[] {
  const lines = csvText.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error('Inventory CSV must contain a header and at least one entry.');

  const headers = parseCsvLine(lines[0]);
  const requiredHeaders = ['repository_path', 'bytes', 'sha256', 'duplicate_group_sha256', 'duplicate_of_path', 'r2_status'];
  if (requiredHeaders.some((header) => !headers.includes(header))) {
    throw new Error('Inventory CSV is missing one or more required columns.');
  }

  return lines.slice(1).map((line, lineIndex) => {
    const values = parseCsvLine(line);
    if (values.length !== headers.length) {
      throw new Error(`Inventory CSV row ${lineIndex + 2} has an unexpected number of columns.`);
    }
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index]]));
    const bytes = Number(row.bytes);
    const sourcePath = row.repository_path;
    if (!sourcePath || path.isAbsolute(sourcePath) || sourcePath.split(/[\\/]/).includes('..')) {
      throw new Error(`Inventory CSV row ${lineIndex + 2} has an unsafe repository_path.`);
    }
    if (!Number.isSafeInteger(bytes) || bytes < 0 || !/^[a-f0-9]{64}$/i.test(row.sha256)) {
      throw new Error(`Inventory CSV row ${lineIndex + 2} has invalid size or SHA-256 data.`);
    }
    if (row.duplicate_of_path && (path.isAbsolute(row.duplicate_of_path) || row.duplicate_of_path.split(/[\\/]/).includes('..'))) {
      throw new Error(`Inventory CSV row ${lineIndex + 2} has an unsafe duplicate_of_path.`);
    }
    return {
      repository_path: sourcePath,
      bytes,
      sha256: row.sha256.toLowerCase(),
      duplicate_group_sha256: row.duplicate_group_sha256 ?? '',
      duplicate_of_path: row.duplicate_of_path || undefined,
      r2_status: row.r2_status || 'not_copied',
    };
  });
}

function normalizedImagePath(repositoryPath: string): string {
  const segments = repositoryPath.replace(/\\/g, '/').split('/').filter(Boolean);
  while (segments.length && /^(backend|public|images)$/i.test(segments[0])) segments.shift();
  return segments.join('/');
}

export function buildR2ObjectKey(repositoryPath: string, sha256: string): string {
  const relativePath = normalizedImagePath(repositoryPath);
  const segments = relativePath.split('/').filter(Boolean).map((segment) => {
    const safe = segment.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
    return safe || 'image';
  });
  if (segments.length === 0) throw new Error('Cannot build an R2 key from an empty image path.');

  const filename = segments.pop()!;
  const extension = path.posix.extname(filename);
  const basename = extension ? filename.slice(0, -extension.length) : filename;
  segments.push(`${basename}-${sha256.slice(0, 16)}${extension}`);
  return `images/${segments.join('/')}`;
}

export async function calculateSha256(filePath: string): Promise<string> {
  const hash = crypto.createHash('sha256');
  await new Promise<void>((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', resolve);
  });
  return hash.digest('hex');
}

function makeReport(items: MigrationItem[], batchSize: number, dryRun: boolean): MigrationReport {
  const count = (status: MigrationStatus) => items.filter((item) => item.status === status).length;
  const batchCount = Math.ceil(items.length / batchSize);
  return {
    dryRun,
    totalEntries: items.length,
    pending: count('pending'),
    migrated: count('migrated'),
    alreadyMigrated: count('already_migrated'),
    duplicates: count('duplicate'),
    checksumMismatches: count('checksum_mismatch'),
    missingSources: count('missing_source'),
    failed: count('failed'),
    databaseReferencesVerified: false,
    unresolvedDatabaseReferences: null,
    batchCount,
    batches: Array.from({ length: batchCount }, (_, batchIndex) => batchIndex),
    items,
  };
}

async function retry<T>(operation: () => Promise<T>, attempts: number): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt + 1 < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 100 * (2 ** attempt)));
      }
    }
  }
  throw lastError;
}

export async function buildMigrationPlan(
  inventoryRows: InventoryEntry[],
  repoRoot: string,
  batchSize = 100,
): Promise<MigrationReport> {
  const normalizedBatchSize = Math.max(1, Math.floor(batchSize));
  const rowsByPath = new Map(inventoryRows.map((row) => [row.repository_path, row]));
  const canonicalKeyByPath = new Map<string, string>();
  const items: MigrationItem[] = [];

  for (let index = 0; index < inventoryRows.length; index += 1) {
    const row = inventoryRows[index];
    const sourcePath = path.resolve(repoRoot, row.repository_path);
    const relative = path.relative(repoRoot, sourcePath);
    let status: MigrationStatus = 'pending';
    let reason = 'source is ready for migration';
    let objectKey = buildR2ObjectKey(row.repository_path, row.sha256);
    let actualBytes: number | undefined;
    let actualSha256: string | undefined;

    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      status = 'failed';
      reason = 'source path resolves outside the repository';
    } else if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) {
      status = 'missing_source';
      reason = 'source file is missing';
    } else {
      actualBytes = fs.statSync(sourcePath).size;
      actualSha256 = await calculateSha256(sourcePath);
      if (actualBytes !== row.bytes || actualSha256 !== row.sha256) {
        status = 'checksum_mismatch';
        reason = 'source size or SHA-256 does not match the inventory';
      }
    }

    if (status === 'pending' && row.duplicate_of_path) {
      const duplicateTarget = rowsByPath.get(row.duplicate_of_path);
      const canonicalKey = canonicalKeyByPath.get(row.duplicate_of_path);
      if (!duplicateTarget || duplicateTarget.sha256 !== row.sha256 || !canonicalKey) {
        status = 'failed';
        reason = 'duplicate target is missing or does not match the duplicate checksum';
      } else {
        objectKey = canonicalKey;
        status = 'duplicate';
        reason = 'content maps to its canonical inventory entry';
      }
    } else if (status === 'pending') {
      canonicalKeyByPath.set(row.repository_path, objectKey);
    }

    items.push({
      repositoryPath: row.repository_path,
      sourcePath,
      objectKey,
      expectedBytes: row.bytes,
      expectedSha256: row.sha256,
      duplicateOf: row.duplicate_of_path,
      status,
      reason,
      actualBytes,
      actualSha256,
      batchIndex: Math.floor(index / normalizedBatchSize),
    });
  }

  return makeReport(items, normalizedBatchSize, true);
}

export function ensureMigrationGuard(execute: boolean): void {
  if (execute && process.env.ALLOW_R2_MIGRATION !== 'true') {
    throw new Error('Migration writes are blocked. Set ALLOW_R2_MIGRATION=true only after explicit approval and backup verification.');
  }
}

export async function runMigrationWorkflow(
  inventoryPath: string,
  repoRoot: string,
  options: {
    dryRun?: boolean;
    batchSize?: number;
    execute?: boolean;
    store?: MigrationObjectStore;
    retries?: number;
  } = {},
): Promise<MigrationReport> {
  const dryRun = options.dryRun ?? true;
  const batchSize = Math.max(1, Math.floor(options.batchSize ?? 100));
  const execute = options.execute ?? false;
  ensureMigrationGuard(execute);
  if (!dryRun && execute && !options.store) throw new Error('R2 object storage is required for migration execution.');

  const rows = parseInventoryCsv(fs.readFileSync(inventoryPath, 'utf8'));
  const report = await buildMigrationPlan(rows, repoRoot, batchSize);
  report.dryRun = dryRun;

  for (const item of report.items) {
    if (item.status !== 'pending') continue;

    try {
      const existing = options.store
        ? await retry(() => options.store!.readObject(item.objectKey), options.retries ?? 3)
        : null;
      if (existing) {
        const existingHash = crypto.createHash('sha256').update(existing).digest('hex');
        if (existing.length !== item.expectedBytes || existingHash !== item.expectedSha256) {
          item.status = 'failed';
          item.reason = 'R2 already contains an object at this key with different content; it was not overwritten';
        } else {
          item.status = 'already_migrated';
          item.reason = 'existing R2 object verified by size and SHA-256';
          item.actualBytes = existing.length;
          item.actualSha256 = existingHash;
        }
        continue;
      }

      if (dryRun || !execute) continue;
      const source = await fs.promises.readFile(item.sourcePath);
      if (source.length !== item.expectedBytes
        || crypto.createHash('sha256').update(source).digest('hex') !== item.expectedSha256) {
        item.status = 'checksum_mismatch';
        item.reason = 'source changed after planning; upload was not attempted';
        continue;
      }

      let foundAfterConditionalWrite = false;
      await retry(async () => {
        try {
          await options.store!.putObjectIfAbsent(item.objectKey, source, imageContentType(item.sourcePath));
        } catch (writeError) {
          const concurrentObject = await options.store!.readObject(item.objectKey);
          if (!concurrentObject
            || concurrentObject.length !== item.expectedBytes
            || crypto.createHash('sha256').update(concurrentObject).digest('hex') !== item.expectedSha256) {
            throw writeError;
          }
          foundAfterConditionalWrite = true;
        }
        const uploaded = await options.store!.readObject(item.objectKey);
        if (!uploaded
          || uploaded.length !== item.expectedBytes
          || crypto.createHash('sha256').update(uploaded).digest('hex') !== item.expectedSha256) {
          throw new Error('Uploaded R2 object failed size or SHA-256 verification.');
        }
      }, options.retries ?? 3);
      item.status = foundAfterConditionalWrite ? 'already_migrated' : 'migrated';
      item.reason = foundAfterConditionalWrite
        ? 'concurrent object verified by size and SHA-256'
        : 'uploaded object verified by size and SHA-256';
      item.actualBytes = source.length;
      item.actualSha256 = item.expectedSha256;
    } catch {
      item.status = 'failed';
      item.reason = 'R2 operation failed; consult sanitized provider/runtime logs';
    }
  }

  const refreshed = makeReport(report.items, batchSize, dryRun);
  return refreshed;
}
