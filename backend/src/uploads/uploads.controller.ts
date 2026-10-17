import fs from 'fs';
import path from 'path';
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import AuthService from '../auth/auth.service';

function getBearerToken(request: any) {
  const authHeader = (request.headers.authorization || '') as string;
  return authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
}

const presignSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
});

export function registerUploadRoutes(app: FastifyInstance, prisma: PrismaClient) {
  const auth = new AuthService(prisma as any);

  app.post('/uploads/presign', async (request, reply) => {
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
        files.push({ fieldname: currentPart.fieldname, filename: currentPart.filename, mimetype: currentPart.mimetype, data: Buffer.concat(chunks) });
      }
      if (files.length === 0) return reply.code(400).send({ success: false, error: { message: 'No file uploaded' } });
      const uploadDir = path.join(__dirname, '..', '..', 'public', 'Images', 'uploads', userId);
      await fs.promises.mkdir(uploadDir, { recursive: true });
      const savedFiles = [] as Array<{ url: string; fileKey: string }>
      for (const file of files) {
        const safeName = file.filename!.replace(/[^a-zA-Z0-9._-]+/g, '-');
        const fileKey = `${userId}/${Date.now()}-${safeName}`;
        const targetPath = path.join(uploadDir, `${Date.now()}-${safeName}`);
        await fs.promises.writeFile(targetPath, file.data);
        const url = `/images/uploads/${userId}/${encodeURIComponent(path.basename(targetPath))}`;
        await prisma.upload.create({ data: { userId, fileKey, url, type: file.mimetype || null, size: file.data.length } });
        savedFiles.push({ url, fileKey });
      }
      reply.send({ success: true, data: savedFiles });
    } catch (err: any) {
      app.log.warn('Upload file failed', err);
      reply.code(400).send({ success: false, error: { message: err.message || 'Could not upload file' } });
    }
  });
}

export default registerUploadRoutes;
