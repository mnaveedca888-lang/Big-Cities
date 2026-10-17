import { apiBaseUrl } from '@/config/runtime';

const DIRECT_IMAGE_PATTERN = /\.(jpg|jpeg|png|webp|svg)(\?.*)?$/i;
const TRUSTED_HOSTS = ['images.unsplash.com', 'images.pexels.com', 'pixabay.com', 'upload.wikimedia.org', 'flagcdn.com'];

const apiBaseOrigin = (() => {
  try {
    return new URL(apiBaseUrl).origin;
  } catch {
    return '';
  }
})();

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isDirectImageUrl(value: unknown): boolean {
  if (typeof value !== 'string' || !value.trim()) return false;

  const normalized = value.trim();

  if (
    normalized.startsWith('/src/') ||
    normalized.startsWith('/@fs/') ||
    normalized.startsWith('/assets/') ||
    normalized.startsWith('/node_modules/') ||
    normalized.startsWith('/images/')
  ) {
    return true;
  }

  if (!isValidUrl(normalized)) return false;

  const parsed = new URL(normalized);
  const hostname = parsed.hostname.toLowerCase();
  const origin = parsed.origin;
  const isTrustedHost = TRUSTED_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
  const isApiImageOrigin = origin === apiBaseOrigin;
  if (!isTrustedHost && !isApiImageOrigin) return false;

  const path = parsed.pathname.toLowerCase();
  return DIRECT_IMAGE_PATTERN.test(normalized) || path.startsWith('/photo') || path.startsWith('/photos/') || path.startsWith('/wp-content/');
}

export function normalizeImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || !isDirectImageUrl(trimmed)) return null;
  if (trimmed.startsWith('/images/')) {
    return `${apiBaseUrl}${trimmed}`;
  }
  return trimmed;
}

export function getFallbackImageUrl() {
  return 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80';
}
