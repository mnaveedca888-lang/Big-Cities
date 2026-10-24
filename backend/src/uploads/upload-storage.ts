import fs from 'fs';
import path from 'path';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export type UploadStorageDriver = 'local' | 's3' | 'disabled';

export type StoreFileInput = {
  userId: string;
  filename: string;
  contentType?: string;
  buffer: Buffer;
  prefix?: string;
};

export type StoredFileResult = {
  fileKey: string;
  url: string;
  size: number;
};

const UPLOADS_ROOT = path.resolve(__dirname, '..', '..', 'public', 'Images', 'uploads');
const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
  'image/bmp',
]);

function sanitizeKeySegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'upload';
}

function buildSafeFileKey(userId: string, filename: string, prefix = 'uploads') {
  const safeUserId = sanitizeKeySegment(userId);
  const safeName = sanitizeKeySegment(filename);
  const timestamp = Date.now();
  return `${safeUserId}/${prefix}/${timestamp}-${safeName}`;
}

function ensureWithinBase(basePath: string, targetPath: string) {
  const relative = path.relative(basePath, targetPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Unsafe upload path');
  }
}

export function getUploadStorageDriver(): UploadStorageDriver {
  const raw = (process.env.UPLOAD_STORAGE_DRIVER ?? 'local').trim().toLowerCase();
  if (raw === 's3' || raw === 'r2' || raw === 'object-storage') return 's3';
  if (raw === 'local') return 'local';
  if (raw === 'disabled') return 'disabled';
  return 'local';
}

export function isAllowedUploadMimeType(contentType?: string | null) {
  if (!contentType) return true;
  return ALLOWED_CONTENT_TYPES.has(contentType.trim().toLowerCase());
}

export function getS3Configuration() {
  if (getUploadStorageDriver() !== 's3') {
    throw new Error('S3/R2 storage is not enabled. Set UPLOAD_STORAGE_DRIVER=s3 and provide OBJECT_STORAGE_* variables.');
  }

  const bucket = process.env.OBJECT_STORAGE_BUCKET?.trim();
  const endpoint = process.env.OBJECT_STORAGE_ENDPOINT?.trim();
  const region = process.env.OBJECT_STORAGE_REGION?.trim() || 'auto';
  const accessKeyId = process.env.OBJECT_STORAGE_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY?.trim();

  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing required object-store configuration: OBJECT_STORAGE_BUCKET, OBJECT_STORAGE_ENDPOINT, OBJECT_STORAGE_ACCESS_KEY_ID, OBJECT_STORAGE_SECRET_ACCESS_KEY');
  }

  return { bucket, endpoint, region, accessKeyId, secretAccessKey };
}

function resolveLocalFilePath(fileKey: string) {
  const relative = fileKey.replace(/^\/+/, '').replace(/\\/g, '/');
  if (!relative || relative.includes('..') || relative.includes('\\')) {
    throw new Error('Invalid storage key');
  }

  const targetPath = path.join(UPLOADS_ROOT, relative);
  ensureWithinBase(UPLOADS_ROOT, targetPath);
  return targetPath;
}

const fileContentTypeByExtension: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.bmp': 'image/bmp',
};

export function createUploadStorage() {
  const driver = getUploadStorageDriver();

  if (driver === 'disabled') {
    return {
      driver,
      async storeFile() {
        throw new Error('Uploads are disabled. Set UPLOAD_STORAGE_DRIVER to local or s3 and enable uploads explicitly.');
      },
      async readFile() {
        throw new Error('Uploads are disabled.');
      },
    };
  }

  if (driver === 's3') {
    const config = getS3Configuration();
    const client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true,
    });

    return {
      driver,
      async storeFile({ userId, filename, contentType, buffer, prefix = 'uploads' }: StoreFileInput): Promise<StoredFileResult> {
        const fileKey = buildSafeFileKey(userId, filename, prefix);
        const key = `${fileKey}`.replace(/^\/+/, '');
        await client.send(new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType || fileContentTypeByExtension[path.extname(filename).toLowerCase()] || 'application/octet-stream',
          CacheControl: 'no-store',
        }));

        return {
          fileKey: key,
          url: `/images/uploads/${key}`,
          size: buffer.length,
        };
      },
      async readFile(fileKey: string) {
        const key = fileKey.replace(/^\/+/, '');
        const response = await client.send(new GetObjectCommand({
          Bucket: config.bucket,
          Key: key,
        }));
        const body = response.Body as NodeJS.ReadableStream | Blob | Uint8Array | undefined;
        const bytes = body instanceof Uint8Array ? body : Buffer.from(await new Response(body as any).arrayBuffer());
        return {
          buffer: Buffer.from(bytes),
          contentType: response.ContentType || fileContentTypeByExtension[path.extname(key).toLowerCase()] || 'application/octet-stream',
        };
      },
    };
  }

  return {
    driver,
    async storeFile({ userId, filename, buffer, prefix = 'uploads' }: StoreFileInput): Promise<StoredFileResult> {
      const fileKey = buildSafeFileKey(userId, filename, prefix);
      const targetPath = resolveLocalFilePath(fileKey);
      await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.promises.writeFile(targetPath, buffer);
      return {
        fileKey,
        url: `/images/uploads/${fileKey}`,
        size: buffer.length,
      };
    },
    async readFile(fileKey: string) {
      const targetPath = resolveLocalFilePath(fileKey);
      const buffer = await fs.promises.readFile(targetPath);
      return {
        buffer,
        contentType: fileContentTypeByExtension[path.extname(targetPath).toLowerCase()] || 'application/octet-stream',
      };
    },
  };
}

export function getObjectStorageUrlForKey(fileKey: string) {
  return `/images/uploads/${fileKey.replace(/^\/+/, '')}`;
}
