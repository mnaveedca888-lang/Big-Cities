import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

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

export type UploadStorage = {
  driver: UploadStorageDriver;
  storeFile(input: StoreFileInput): Promise<StoredFileResult>;
  readFile(fileKey: string): Promise<{ buffer: Buffer; contentType: string }>;
  deleteFile(fileKey: string): Promise<void>;
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
  const safePrefix = prefix === 'uploads' ? '' : `${sanitizeKeySegment(prefix)}/`;
  return `${safeUserId}/${safePrefix}${Date.now()}-${randomUUID()}-${safeName}`;
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

const extensionsByContentType: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'image/svg+xml': ['.svg'],
  'image/avif': ['.avif'],
  'image/bmp': ['.bmp'],
};

export function isValidImageContent(contentType: string | undefined, filename: string, buffer: Buffer) {
  const normalizedType = contentType?.trim().toLowerCase();
  if (!normalizedType || !isAllowedUploadMimeType(normalizedType)) return false;
  if (!hasMatchingImageExtension(normalizedType, filename)) return false;

  switch (normalizedType) {
    case 'image/jpeg':
      return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case 'image/png':
      return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case 'image/webp':
      return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
    case 'image/gif':
      return buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a';
    case 'image/avif':
      return buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp' && /^(avif|avis)$/.test(buffer.toString('ascii', 8, 12));
    case 'image/bmp':
      return buffer.length >= 2 && buffer.toString('ascii', 0, 2) === 'BM';
    case 'image/svg+xml': {
      const svg = buffer.toString('utf8').trim();
      return /^<svg(?:\s|>)/i.test(svg) && !/<script\b|<foreignObject\b|\son\w+\s*=|(?:href|src)\s*=\s*["']\s*(?:https?:|javascript:|data:)/i.test(svg);
    }
    default:
      return false;
  }
}

export function hasMatchingImageExtension(contentType: string | undefined, filename: string) {
  const normalizedType = contentType?.trim().toLowerCase();
  return Boolean(normalizedType && extensionsByContentType[normalizedType]?.includes(path.extname(filename).toLowerCase()));
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

export function createUploadStorage(): UploadStorage {
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
      async deleteFile() {
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
        const body = response.Body as NodeJS.ReadableStream | Uint8Array | undefined;
        const chunks: Buffer[] = [];
        if (body instanceof Uint8Array) {
          chunks.push(Buffer.from(body));
        } else if (body && typeof (body as any)[Symbol.asyncIterator] === 'function') {
          for await (const chunk of body as any) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        } else {
          throw new Error('Object storage returned an empty image body.');
        }
        return {
          buffer: Buffer.concat(chunks),
          contentType: response.ContentType || fileContentTypeByExtension[path.extname(key).toLowerCase()] || 'application/octet-stream',
        };
      },
      async deleteFile(fileKey: string) {
        await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: fileKey.replace(/^\/+/, '') }));
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
    async deleteFile(fileKey: string) {
      await fs.promises.rm(resolveLocalFilePath(fileKey), { force: true });
    },
  };
}

export function registerUploadImageRoutes(app: import('fastify').FastifyInstance, storage?: UploadStorage) {
  app.get('/images/uploads/*', async (request, reply) => {
    const rawKey = String((request.params as Record<string, string>)['*'] ?? '');
    let fileKey: string;
    try {
      fileKey = decodeURIComponent(rawKey).replace(/^\/+/, '');
    } catch {
      return reply.code(400).send({ success: false, error: { code: 'INVALID_PATH', message: 'Invalid image path.' } });
    }
    if (!fileKey || fileKey.includes('..') || fileKey.includes('\\')) {
      return reply.code(400).send({ success: false, error: { code: 'INVALID_PATH', message: 'Invalid image path.' } });
    }

    try {
      const image = await (storage ?? createUploadStorage()).readFile(fileKey);
      return reply
        .header('Content-Type', image.contentType)
        .header('Cache-Control', 'private, max-age=300, no-transform')
        .header('X-Content-Type-Options', 'nosniff')
        .send(image.buffer);
    } catch (error: any) {
      if (/Missing required object-store configuration|S3\/R2 storage is not enabled|Uploads are disabled/i.test(String(error?.message ?? ''))) {
        return reply.code(503).send({ success: false, error: { code: 'IMAGE_STORAGE_UNAVAILABLE', message: 'Image storage is not configured.' } });
      }
      app.log.warn({ fileKey, error: String(error?.message ?? 'unknown') }, 'Image read failed');
      return reply.code(404).send({ success: false, error: { code: 'IMAGE_NOT_FOUND', message: 'Image not found.' } });
    }
  });
}

export function getObjectStorageUrlForKey(fileKey: string) {
  return `/images/uploads/${fileKey.replace(/^\/+/, '')}`;
}
