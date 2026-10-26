import fs from 'fs';
import path from 'path';
import { Prisma, PrismaClient } from '@prisma/client';

const IMAGE_ROOT = path.resolve(__dirname, '..', '..', 'public', 'Images');
const IMAGE_EXTENSION = /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp|ico)$/i;

export function normalizeLocalImageUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/images/')) return null;

  const encodedSegments = value.slice('/images/'.length).split(/[?#]/, 1)[0].split('/');
  try {
    const segments = encodedSegments.map((segment) => decodeURIComponent(segment));
    if (segments.some((segment) => !segment || segment === '.' || segment === '..' || segment.includes('/') || segment.includes('\\'))) return null;

    let absolutePath = IMAGE_ROOT;
    for (const segment of segments) {
      const entries = fs.readdirSync(absolutePath);
      if (!entries.includes(segment)) return null;
      absolutePath = path.join(absolutePath, segment);
    }
    const relativePath = path.relative(IMAGE_ROOT, absolutePath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath) || !IMAGE_EXTENSION.test(absolutePath)) return null;
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) return null;

    return `/images/${segments.map(encodeURIComponent).join('/')}`;
  } catch {
    return null;
  }
}

function isSafePersistentUploadUrl(value: unknown) {
  const driver = process.env.UPLOAD_STORAGE_DRIVER?.trim().toLowerCase();
  if (!['r2', 's3', 'object-storage'].includes(driver ?? '') || typeof value !== 'string') return false;
  const match = /^\/images\/uploads\/([^/]+)\/([^/]+)$/.exec(value);
  if (!match) return false;
  try {
    const segments = match.slice(1).map(decodeURIComponent);
    return segments.every((segment) => segment.length > 0 && segment !== '.' && segment !== '..'
      && !segment.includes('/') && !segment.includes('\\'));
  } catch {
    return false;
  }
}

export function localImageUrl(...segments: string[]): string | null {
  if (!segments.length) return null;
  return normalizeLocalImageUrl(`/images/${segments.map(encodeURIComponent).join('/')}`);
}

function rejectInvalidImageFields(value: unknown, model: string, fieldPath: string[] = []) {
  if (!value || typeof value !== 'object') return;

  for (const [key, entry] of Object.entries(value)) {
    const currentPath = [...fieldPath, key];
    const isImageField = /(image|thumbnail|avatar|flag|logo)/i.test(key) || (model === 'Upload' && key === 'url');
    if (isImageField) {
      if (entry != null && (typeof entry !== 'string' || (!normalizeLocalImageUrl(entry) && !isSafePersistentUploadUrl(entry)))) {
        throw new Error(`Database image writes require a valid /images/ path or configured object-storage URL: ${currentPath.join('.')}`);
      }
    } else if (entry && typeof entry === 'object') {
      rejectInvalidImageFields(entry, model, currentPath);
    }
  }
}

export const localImageWriteMiddleware: Prisma.Middleware = async (params, next) => {
  const writeActions = new Set(['create', 'createMany', 'update', 'updateMany', 'upsert']);
  if (params.model && writeActions.has(params.action)) {
    rejectInvalidImageFields(params.args?.data, params.model);
    if (params.action === 'upsert') {
      rejectInvalidImageFields(params.args?.create, params.model);
      rejectInvalidImageFields(params.args?.update, params.model);
    }
  }
  return next(params);
};

export function installLocalImageWriteGuard(prisma: PrismaClient) {
  prisma.$use(localImageWriteMiddleware);
}