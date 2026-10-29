const imageExtension = /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp|ico)$/i;

function normalizeLocalImageUrl(value) {
  if (typeof value !== 'string' || !value.startsWith('/images/')) return null;

  try {
    const segments = value.slice('/images/'.length).split(/[?#]/, 1)[0].split('/').map(decodeURIComponent);
    if (segments.some((segment) => !segment || segment === '.' || segment === '..' || segment.includes('/') || segment.includes('\\') || segment.includes('\0'))) return null;
    if (!imageExtension.test(segments[segments.length - 1] ?? '')) return null;
    return `/images/${segments.map(encodeURIComponent).join('/')}`;
  } catch {
    return null;
  }
}

function sanitizeImageFields(value, model, fieldPath = []) {
  if (!value || typeof value !== 'object' || value instanceof Date || Buffer.isBuffer(value)) return;

  if (Array.isArray(value)) {
    value.forEach((entry, index) => sanitizeImageFields(entry, model, [...fieldPath, index]));
    return;
  }

  for (const [key, entry] of Object.entries(value)) {
    const currentPath = [...fieldPath, key];
    if (/(image|thumbnail|avatar|flag|logo)/i.test(key) || (model === 'Upload' && key === 'url')) {
      if (entry == null) continue;
      const localUrl = normalizeLocalImageUrl(entry);
      if (!localUrl) {
        console.warn(`[local-image-write-guard] Removed unsafe image reference at ${model}.${currentPath.join('.')}`);
        value[key] = null;
      } else {
        value[key] = localUrl;
      }
    } else {
      sanitizeImageFields(entry, model, currentPath);
    }
  }
}

module.exports = function installLocalImageWriteGuard(prisma) {
  prisma.$use(async (params, next) => {
    if (params.model && ['create', 'createMany', 'update', 'updateMany', 'upsert'].includes(params.action)) {
      sanitizeImageFields(params.args?.data, params.model);
      if (params.action === 'upsert') {
        sanitizeImageFields(params.args?.create, params.model);
        sanitizeImageFields(params.args?.update, params.model);
      }
    }
    return next(params);
  });
};