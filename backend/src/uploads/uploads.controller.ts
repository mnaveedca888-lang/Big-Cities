import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import AuthService from '../auth/auth.service';
import { databaseWritesEnabled } from '../staging-write-guard';
import { createUploadStorage, hasMatchingImageExtension, isAllowedUploadMimeType, isValidImageContent, type UploadStorage } from './upload-storage';
import { sendApiError } from '../utils/api-error';
import { enqueueOwnedImageCleanup, getUnattachedUploadExpiresAt } from './image-lifecycle';

function getBearerToken(request: any) {
  const authHeader = (request.headers.authorization || '') as string;
  return authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
}

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

export function registerUploadRoutes(app: FastifyInstance, prisma: PrismaClient, storage?: UploadStorage) {
  const auth = new AuthService(prisma as any);

  const uploadsEnabled = () => databaseWritesEnabled() && process.env.UPLOADS_ENABLED === 'true';

  const verifyAdmin = async (token: string | null) => {
    if (!token) throw Object.assign(new Error('Missing token'), { statusCode: 401 });
    let userId: string;
    try {
      userId = await auth.verifyAccessToken(token);
    } catch {
      throw Object.assign(new Error('Invalid token'), { statusCode: 403 });
    }
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    if (!user || user.role?.name !== 'admin') throw Object.assign(new Error('Admin access required'), { statusCode: 403 });
    return userId;
  };

  app.post('/uploads/presign', async (request, reply) => {
    if (!uploadsEnabled()) {
      return reply.code(403).send({ success: false, error: { message: 'Uploads are disabled in staging.' } });
    }
    return reply.code(501).send({ success: false, error: { message: 'Direct presigned uploads are not supported. Use /uploads/files.' } });
  });

  app.post('/uploads/files', async (request, reply) => {
    if (!uploadsEnabled()) {
      return reply.code(403).send({ success: false, error: { message: 'Uploads are disabled in staging.' } });
    }
    try {
      const userId = await verifyAdmin(getBearerToken(request));
      let file: { filename: string; mimetype: string; buffer: Buffer } | undefined;
      let hasMultipleFiles = false;
      for await (const part of (request as any).parts()) {
        if (!part.file) continue;
        const buffer = await part.toBuffer();
        if (file) hasMultipleFiles = true;
        else file = { filename: part.filename, mimetype: part.mimetype, buffer };
      }
      if (hasMultipleFiles) return reply.code(400).send({ success: false, error: { message: 'Upload one image at a time.' } });
      if (!file) return reply.code(400).send({ success: false, error: { message: 'No file uploaded.' } });
      const buffer = file.buffer;
      if (buffer.length === 0) return reply.code(400).send({ success: false, error: { message: 'Uploaded file is empty.' } });
      if (buffer.length > MAX_UPLOAD_SIZE) return reply.code(413).send({ success: false, error: { message: 'Image exceeds the 5 MB upload limit.' } });
      if (!isAllowedUploadMimeType(file.mimetype) || !hasMatchingImageExtension(file.mimetype, file.filename)) {
        return reply.code(400).send({ success: false, error: { message: 'Image file extension does not match its content type.' } });
      }
      if (!await isValidImageContent(file.mimetype, file.filename, buffer)) {
        return reply.code(400).send({ success: false, error: { message: 'Image content does not match its content type.' } });
      }

      const activeStorage = storage ?? createUploadStorage();
      if (activeStorage.driver === 'disabled' || (process.env.NODE_ENV === 'production' && activeStorage.driver === 'local')) {
        return reply.code(503).send({ success: false, error: { message: 'Image storage is not configured or is temporarily unavailable.' } });
      }
      const stored = await activeStorage.storeFile({ userId, filename: file.filename, contentType: file.mimetype, buffer });
      try {
        await prisma.upload.create({
          data: {
            userId,
            fileKey: stored.fileKey,
            url: stored.url,
            type: file.mimetype,
            size: stored.size,
            expiresAt: getUnattachedUploadExpiresAt(),
          },
        });
      } catch (error) {
        try {
          await activeStorage.deleteFile(stored.fileKey);
        } catch (cleanupError) {
          app.log.error({ fileKey: stored.fileKey }, 'Failed to remove uploaded image after metadata failure');
          try {
            await enqueueOwnedImageCleanup(prisma, stored.url);
            app.log.warn({ fileKey: stored.fileKey }, 'Queued uploaded image for retry after metadata failure');
          } catch {
            app.log.error({ fileKey: stored.fileKey }, 'Failed to queue uploaded image cleanup after metadata failure');
            return reply.code(500).send({ success: false, error: { message: 'Upload metadata failed; object cleanup also failed and could not be queued.' } });
          }
          return reply.code(500).send({ success: false, error: { message: 'Upload metadata could not be saved; object cleanup is queued for retry.' } });
        }
        throw error;
      }
      return reply.send({ success: true, data: [{ url: stored.url, fileKey: stored.fileKey, size: stored.size }] });
    } catch (err: any) {
      if (err?.code === 'FST_REQ_FILE_TOO_LARGE' || err?.statusCode === 413) {
        return reply.code(413).send({ success: false, error: { message: 'Image exceeds the 5 MB upload limit.' } });
      }
      return sendApiError(reply, app.log, err, 'Upload file request failed');
    }
  });
}

export default registerUploadRoutes;
