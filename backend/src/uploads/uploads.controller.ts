import path from 'path';
import { randomUUID } from 'crypto';
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import AuthService from '../auth/auth.service';
import { databaseWritesEnabled } from '../staging-write-guard';
import { createUploadStorage, type UploadStorage } from './upload-storage';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

function imageBytesMatchType(contentType: string, data: Buffer) {
  if (contentType === 'image/jpeg') return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  if (contentType === 'image/png') return data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (contentType === 'image/gif') return ['GIF87a', 'GIF89a'].includes(data.subarray(0, 6).toString('ascii'));
  if (contentType === 'image/webp') return data.subarray(0, 4).toString('ascii') === 'RIFF'
    && data.subarray(8, 12).toString('ascii') === 'WEBP';
  if (contentType === 'image/avif') {
    if (data.subarray(4, 8).toString('ascii') !== 'ftyp') return false;
    const brands = data.subarray(8, Math.min(data.length, 64)).toString('ascii');
    return brands.includes('avif') || brands.includes('avis');
  }
  return false;
}

function getBearerToken(request: any) {
  const authHeader = (request.headers.authorization || '') as string;
  return authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
}

export function registerUploadRoutes(app: FastifyInstance, prisma: PrismaClient, storage: UploadStorage = createUploadStorage()) {
  const auth = new AuthService(prisma as any);

  const uploadsEnabled = () => databaseWritesEnabled() && process.env.UPLOADS_ENABLED === 'true';

  const verifyAdmin = async (token: string) => {
    const userId = await auth.verifyAccessToken(token).catch(() => null);
    if (!userId) return null;
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    return user?.role?.name === 'admin' ? userId : null;
  };

  app.post('/uploads/presign', async (request, reply) => {
    if (!uploadsEnabled()) {
      return reply.code(403).send({ success: false, error: { message: 'Uploads are disabled in staging.' } });
    }
    try {
      const token = getBearerToken(request);
      if (!token) return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
      const userId = await verifyAdmin(token);
      if (!userId) return reply.code(403).send({ success: false, error: { message: 'Forbidden' } });
      return reply.code(501).send({
        success: false,
        error: { message: 'Direct-to-storage uploads are not supported. Upload the file through /uploads/files.' },
      });
    } catch (error) {
      app.log.error({ err: error }, 'Upload presign endpoint failed');
      return reply.code(500).send({ success: false, error: { message: 'Could not process upload request.' } });
    }
  });

  app.post('/uploads/files', async (request, reply) => {
    if (!uploadsEnabled()) {
      return reply.code(403).send({ success: false, error: { message: 'Uploads are disabled in staging.' } });
    }
    try {
      const token = getBearerToken(request);
      if (!token) return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
      const userId = await verifyAdmin(token);
      if (!userId) return reply.code(403).send({ success: false, error: { message: 'Forbidden' } });
      const parts = await (request as any).parts();
      const files: Array<{ fieldname: string; filename: string | undefined; mimetype: string | undefined; data: Buffer }> = [];
      for await (const part of parts as any[]) {
        const currentPart = part as any;
        if (!currentPart.file || !currentPart.filename) continue;
        const chunks: Uint8Array[] = [];
        for await (const chunk of currentPart.file) chunks.push(chunk);
        files.push({ fieldname: currentPart.fieldname, filename: currentPart.filename, mimetype: currentPart.mimetype, data: Buffer.concat(chunks) });
      }
      if (files.length === 0) return reply.code(400).send({ success: false, error: { message: 'No file uploaded' } });
      for (const file of files) {
        if (!file.mimetype || !ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
          return reply.code(400).send({ success: false, error: { message: 'Unsupported image type.' } });
        }
        if (file.data.length > MAX_UPLOAD_BYTES) {
          return reply.code(413).send({ success: false, error: { message: 'Image exceeds the 5 MB upload limit.' } });
        }
        const extension = path.extname(file.filename ?? '').toLowerCase();
        const expectedExtensions: Record<string, string[]> = {
          'image/jpeg': ['.jpg', '.jpeg'],
          'image/png': ['.png'],
          'image/webp': ['.webp'],
          'image/gif': ['.gif'],
          'image/avif': ['.avif'],
        };
        if (!expectedExtensions[file.mimetype].includes(extension)) {
          return reply.code(400).send({ success: false, error: { message: 'Image file extension does not match its content type.' } });
        }
        if (!imageBytesMatchType(file.mimetype, file.data)) {
          return reply.code(400).send({ success: false, error: { message: 'Image content does not match its content type.' } });
        }
      }
      if (files.length > 1) return reply.code(400).send({ success: false, error: { message: 'Upload one image at a time.' } });
      const savedFiles = [] as Array<{ url: string; fileKey: string }>
      for (const file of files) {
        const extension = path.extname(file.filename ?? '').toLowerCase();
        const fileName = `${randomUUID()}${extension}`;
        const fileKey = `${userId}/${fileName}`;
        const url = `/images/uploads/${userId}/${fileName}`;
        await storage.put(fileKey, file.data, file.mimetype || 'application/octet-stream');
        try {
          await prisma.upload.create({ data: { userId, fileKey, url, type: file.mimetype || null, size: file.data.length } });
        } catch (error) {
          try {
            await storage.remove(fileKey);
          } catch (cleanupError) {
            app.log.error({ err: cleanupError, fileKey }, 'Failed to clean up an unassociated uploaded image');
          }
          throw error;
        }
        savedFiles.push({ url, fileKey });
      }
      reply.send({ success: true, data: savedFiles });
    } catch (error: any) {
      app.log.error({ err: error }, 'Upload file failed');
      if (error?.code === 'FST_REQ_FILE_TOO_LARGE') {
        return reply.code(413).send({ success: false, error: { message: 'Image exceeds the 5 MB upload limit.' } });
      }
      if (error?.code === 'FST_FILES_LIMIT') {
        return reply.code(400).send({ success: false, error: { message: 'Upload one image at a time.' } });
      }
      const storageMode = process.env.UPLOAD_STORAGE_DRIVER;
      if (storageMode === 's3' || storageMode === 'disabled' || (!storageMode && process.env.NODE_ENV === 'production')) {
        return reply.code(503).send({ success: false, error: { message: 'Image storage is not configured or is temporarily unavailable.' } });
      }
      return reply.code(500).send({ success: false, error: { message: 'Could not upload image.' } });
    }
  });
}

export default registerUploadRoutes;
