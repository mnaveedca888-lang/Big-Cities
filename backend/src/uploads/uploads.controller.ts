import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import AuthService from '../auth/auth.service';
import { databaseWritesEnabled } from '../staging-write-guard';
import { createUploadStorage, getUploadStorageDriver, isAllowedUploadMimeType } from './upload-storage';

function getBearerToken(request: any) {
  const authHeader = (request.headers.authorization || '') as string;
  return authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
}

const presignSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
});

const uploadStorage = createUploadStorage();

export function registerUploadRoutes(app: FastifyInstance, prisma: PrismaClient) {
  const auth = new AuthService(prisma as any);

  const uploadsEnabled = () => databaseWritesEnabled() && process.env.UPLOADS_ENABLED === 'true' && getUploadStorageDriver() !== 'disabled';

  app.post('/uploads/presign', async (request, reply) => {
    if (!uploadsEnabled()) {
      return reply.code(403).send({ success: false, error: { message: 'Uploads are disabled in staging.' } });
    }
    try {
      const token = getBearerToken(request);
      if (!token) return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
      const userId = await auth.verifyAccessToken(token);
      const body = presignSchema.parse(request.body || {});
      const safeName = body.filename.replace(/[^a-zA-Z0-9._-]+/g, '-');
      const fileKey = `${userId}/${Date.now()}-${safeName}`;
      const url = `/images/uploads/${fileKey}`;
      const upload = await prisma.upload.create({ data: { userId, fileKey, url, type: body.contentType, size: 0 } });
      reply.send({ success: true, data: { url: upload.url, fields: { fileKey, contentType: body.contentType } } });
    } catch (err: any) {
      if (err && err.name === 'ZodError') return reply.code(400).send({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid input' } });
      app.log.warn('Upload presign failed', err);
      reply.code(400).send({ success: false, error: { message: err.message || 'Could not create upload presign' } });
    }
  });

  app.post('/uploads/files', async (request, reply) => {
    if (!uploadsEnabled()) {
      return reply.code(403).send({ success: false, error: { message: 'Uploads are disabled in staging.' } });
    }
    try {
      const token = getBearerToken(request);
      if (!token) return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
      const userId = await auth.verifyAccessToken(token);
      const parts = await (request as any).parts();
      const files: Array<{ fieldname: string; filename: string | undefined; mimetype: string | undefined; data: Buffer }> = [];
      for await (const part of parts as any[]) {
        const currentPart = part as any;
        if (!currentPart.file || !currentPart.filename) continue;
        const chunks: Uint8Array[] = [];
        for await (const chunk of currentPart.file) chunks.push(chunk);
        const finalBuffer = Buffer.concat(chunks);
        files.push({ fieldname: currentPart.fieldname, filename: currentPart.filename, mimetype: currentPart.mimetype, data: finalBuffer });
      }
      if (files.length === 0) return reply.code(400).send({ success: false, error: { message: 'No file uploaded' } });

      const savedFiles = [] as Array<{ url: string; fileKey: string; size: number }>
      for (const file of files) {
        if (file.data.length === 0) {
          throw new Error('Uploaded file is empty.');
        }
        if (file.data.length > 20 * 1024 * 1024) {
          throw new Error('Uploaded file exceeds the 20 MiB limit.');
        }
        if (!isAllowedUploadMimeType(file.mimetype)) {
          throw new Error('Unsupported file type. Use JPG, PNG, WEBP, GIF, AVIF, SVG, or BMP.');
        }
        const safeName = (file.filename || 'upload').replace(/[^a-zA-Z0-9._-]+/g, '-');
        const stored = await uploadStorage.storeFile({
          userId,
          filename: safeName,
          contentType: file.mimetype || 'application/octet-stream',
          buffer: file.data,
        });
        const fileKey = stored.fileKey;
        const url = stored.url;
        await prisma.upload.create({ data: { userId, fileKey, url, type: file.mimetype || null, size: stored.size } });
        savedFiles.push({ url, fileKey, size: stored.size });
      }
      reply.send({ success: true, data: savedFiles });
    } catch (err: any) {
      app.log.warn('Upload file failed', err);
      reply.code(400).send({ success: false, error: { message: err.message || 'Could not upload file' } });
    }
  });
}

export default registerUploadRoutes;
