import { Prisma, PrismaClient } from '@prisma/client';

const IMAGE_EXTENSION = /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp|ico)$/i;

export function normalizeLocalImageUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/images/')) return null;

  const encodedSegments = value.slice('/images/'.length).split(/[?#]/, 1)[0].split('/');
  try {
    const segments = encodedSegments.map((segment) => decodeURIComponent(segment));
    if (segments.some((segment) => !segment || segment === '.' || segment === '..' || segment.includes('/') || segment.includes('\\') || segment.includes('\0'))) return null;
    if (!IMAGE_EXTENSION.test(segments[segments.length - 1] ?? '')) return null;

    return `/images/${segments.map(encodeURIComponent).join('/')}`;
  } catch {
    return null;
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
      if (entry != null && (typeof entry !== 'string' || !normalizeLocalImageUrl(entry))) {
        throw new Error(`Database image writes require a safe /images/ object key: ${currentPath.join('.')}`);
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