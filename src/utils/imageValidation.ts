import { apiBaseUrl } from '@/config/runtime';

const IMAGE_EXTENSION_PATTERN = /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp|ico)$/i;

const apiBaseOrigin = (() => {
  try {
    return new URL(apiBaseUrl).origin;
  } catch {
    return '';
  }
})();

function isSafeLocalImagePath(pathname: string) {
  const isViteSourceAsset = import.meta.env.DEV && pathname.startsWith('/src/assets/');
  if (!pathname.startsWith('/images/') && !pathname.startsWith('/assets/') && !isViteSourceAsset && pathname !== '/favicon.svg') return false;
  if (pathname !== '/favicon.svg' && !IMAGE_EXTENSION_PATTERN.test(pathname)) return false;

  try {
    const segments = pathname.split('/').slice(1).map((segment) => decodeURIComponent(segment));
    return segments.every((segment) => segment && segment !== '.' && segment !== '..' && !segment.includes('/') && !segment.includes('\\'));
  } catch {
    return false;
  }
}

function resolveLocalImagePath(value: string): { pathname: string; origin: string | null } | null {
  const normalized = value.trim();
  if (!normalized) return null;

  if (normalized.startsWith('/')) {
    const pathname = normalized.split(/[?#]/, 1)[0];
    return isSafeLocalImagePath(pathname) ? { pathname, origin: null } : null;
  }

  try {
    const parsed = new URL(normalized);
    if (!['http:', 'https:'].includes(parsed.protocol) || !isSafeLocalImagePath(parsed.pathname)) return null;

    const isConfiguredApi = Boolean(apiBaseOrigin && parsed.origin === apiBaseOrigin);
    const isCurrentOrigin = typeof window !== 'undefined' && parsed.origin === window.location.origin;
    const isLoopbackDevApi = import.meta.env.DEV && ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
    if (!isConfiguredApi && !isCurrentOrigin && !isLoopbackDevApi) return null;

    return { pathname: `${parsed.pathname}${parsed.search}${parsed.hash}`, origin: parsed.origin };
  } catch {
    return null;
  }
}

export function isDirectImageUrl(value: unknown): boolean {
  return typeof value === 'string' && resolveLocalImagePath(value) !== null;
}

export function normalizeImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const resolved = resolveLocalImagePath(value);
  if (!resolved) return null;

  if (resolved.pathname.startsWith('/images/')) {
    const baseUrl = apiBaseUrl.replace(/\/+$/, '');
    if (!baseUrl && import.meta.env.PROD) return null;
    return `${baseUrl || resolved.origin || ''}${resolved.pathname}`;
  }
  return resolved.pathname;
}
