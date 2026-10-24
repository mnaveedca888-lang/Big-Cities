import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import type { FastifyInstance } from 'fastify';
import { normalizeLocalImageUrl } from '../images/local-image';

const IMAGE_ROOT = path.resolve(__dirname, '..', '..', 'public', 'Images');

export interface StoredImage {
  body: Readable;
  contentType?: string;
}

export interface UploadStorage {
  put(fileKey: string, data: Buffer, contentType: string): Promise<void>;
  remove(fileKey: string): Promise<void>;
  get(fileKey: string): Promise<StoredImage | null>;
}

type UploadStorageDriver = 'local' | 's3' | 'disabled';

interface S3Configuration {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

function isSafeFileKey(fileKey: string) {
  const segments = fileKey.split('/');
  return segments.length === 2
    && segments.every((segment) => segment.length > 0 && segment !== '.' && segment !== '..'
      && !segment.includes('\\') && !segment.includes('%'));
}

function getDriver(): UploadStorageDriver {
  const configured = process.env.UPLOAD_STORAGE_DRIVER;
  if (configured === 'local' || configured === 's3' || configured === 'disabled') return configured;
  if (configured) throw new Error('UPLOAD_STORAGE_DRIVER must be local, s3, or disabled.');
  return process.env.NODE_ENV === 'production' ? 'disabled' : 'local';
}

function getS3Configuration(): S3Configuration {
  const required = (name: string) => {
    const value = process.env[name];
    if (!value) throw new Error(`Missing required object storage configuration: ${name}.`);
    return value;
  };
  return {
    endpoint: required('OBJECT_STORAGE_ENDPOINT'),
    region: required('OBJECT_STORAGE_REGION'),
    bucket: required('OBJECT_STORAGE_BUCKET'),
    accessKeyId: required('OBJECT_STORAGE_ACCESS_KEY_ID'),
    secretAccessKey: required('OBJECT_STORAGE_SECRET_ACCESS_KEY'),
  };
}

function localFilePath(fileKey: string) {
  if (!isSafeFileKey(fileKey)) throw new Error('Invalid upload file key.');
  return path.join(IMAGE_ROOT, 'uploads', ...fileKey.split('/'));
}

export function createUploadStorage(): UploadStorage {
  let client: S3Client | undefined;
  let clientConfiguration: S3Configuration | undefined;

  const getS3Client = () => {
    const configuration = getS3Configuration();
    if (!client || JSON.stringify(configuration) !== JSON.stringify(clientConfiguration)) {
      client?.destroy();
      clientConfiguration = configuration;
      client = new S3Client({
        endpoint: configuration.endpoint,
        region: configuration.region,
        forcePathStyle: true,
        credentials: {
          accessKeyId: configuration.accessKeyId,
          secretAccessKey: configuration.secretAccessKey,
        },
      });
    }
    return { client, configuration };
  };

  return {
    async put(fileKey, data, contentType) {
      if (!isSafeFileKey(fileKey)) throw new Error('Invalid upload file key.');
      const driver = getDriver();
      if (driver === 'disabled') throw new Error('Image upload storage is not configured.');
      if (driver === 'local') {
        const targetPath = localFilePath(fileKey);
        await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
        await fs.promises.writeFile(targetPath, data, { flag: 'wx' });
        return;
      }
      const { client: s3, configuration } = getS3Client();
      await s3.send(new PutObjectCommand({
        Bucket: configuration.bucket,
        Key: fileKey,
        Body: data,
        ContentLength: data.length,
        ContentType: contentType,
        IfNoneMatch: '*',
      }));
    },
    async remove(fileKey) {
      if (!isSafeFileKey(fileKey)) throw new Error('Invalid upload file key.');
      const driver = getDriver();
      if (driver === 'disabled') return;
      if (driver === 'local') {
        await fs.promises.unlink(localFilePath(fileKey));
        return;
      }
      const { client: s3, configuration } = getS3Client();
      await s3.send(new DeleteObjectCommand({ Bucket: configuration.bucket, Key: fileKey }));
    },
    async get(fileKey) {
      if (!isSafeFileKey(fileKey) || getDriver() !== 's3') return null;
      const { client: s3, configuration } = getS3Client();
      try {
        const response = await s3.send(new GetObjectCommand({ Bucket: configuration.bucket, Key: fileKey }));
        if (!response.Body) throw new Error('Object storage returned an empty image body.');
        return {
          body: Readable.from([await response.Body.transformToByteArray()]),
          contentType: response.ContentType,
        };
      } catch (error) {
        const name = (error as { name?: string }).name;
        if (name === 'NoSuchKey' || name === 'NotFound' || name === 'NoSuchObject') return null;
        throw error;
      }
    },
  };
}

function imageContentType(fileKey: string) {
  const extension = path.extname(fileKey).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.avif': 'image/avif',
  };
  return contentTypes[extension] ?? 'application/octet-stream';
}

export function registerUploadImageRoutes(app: FastifyInstance, storage: UploadStorage = createUploadStorage()) {
  app.get<{ Params: { '*': string } }>('/images/uploads/*', async (request, reply) => {
    const fileKey = request.params['*'];
    if (!isSafeFileKey(fileKey)) return reply.code(404).send();

    try {
      const storedImage = await storage.get(fileKey);
      if (storedImage) {
        reply.type(storedImage.contentType || imageContentType(fileKey));
        reply.header('Cache-Control', 'public, max-age=300');
        return reply.send(storedImage.body);
      }
    } catch (error) {
      app.log.error({ err: error }, 'Persistent image retrieval failed');
      return reply.code(503).send({ success: false, error: { message: 'Image storage is temporarily unavailable.' } });
    }

    const localUrl = normalizeLocalImageUrl(`/images/uploads/${fileKey}`);
    if (!localUrl) return reply.code(404).send();
    const localPath = path.join(IMAGE_ROOT, 'uploads', ...fileKey.split('/'));
    reply.type(imageContentType(fileKey));
    reply.header('Cache-Control', 'public, max-age=300');
    return reply.send(fs.createReadStream(localPath));
  });
}
