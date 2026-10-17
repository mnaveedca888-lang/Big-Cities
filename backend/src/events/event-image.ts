import fs from 'fs';
import path from 'path';

const IMAGE_PREFIX = '/images';
const PAKISTAN_IMAGES_DIR = path.join(__dirname, '..', '..', 'public', 'images', 'Events in Pakistan');
const AZERBAIJAN_IMAGES_DIR = path.join(__dirname, '..', '..', 'public', 'images', 'Azerbaijan events images');

const pakistaniEventFileNames = fs.existsSync(PAKISTAN_IMAGES_DIR)
  ? fs.readdirSync(PAKISTAN_IMAGES_DIR).filter((fileName) => /\.(jpe?g|png|webp)$/i.test(fileName))
  : [];

const azerbaijanEventFileNames = fs.existsSync(AZERBAIJAN_IMAGES_DIR)
  ? fs.readdirSync(AZERBAIJAN_IMAGES_DIR).filter((fileName) => /\.(jpe?g|png|webp)$/i.test(fileName))
  : [];

const normalizeKey = (value: string) =>
  String(value)
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[-_/]+/g, ' ')
    .replace(/[^a-z0-9'" ]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const normalizeToTokens = (value: string) =>
  normalizeKey(value)
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => token.length >= 3)
    .filter((token) => !['the', 'a', 'an', 'of', 'in', 'on', 'and', 'for', 'to', 'near', 'at', 'by', 'with', 'day', 'festival', 'celebrations', 'celebration', 'show', 'conference', 'mela'].includes(token));

const eventImageMap = new Map<string, string>();
const eventImageTokens = new Map<string, string[]>();

for (const fileName of pakistaniEventFileNames) {
  const fileBase = fileName.replace(/\.[^.]+$/, '');
  const normalizedKey = normalizeKey(fileBase);
  eventImageMap.set(normalizedKey, fileName);
  eventImageTokens.set(normalizedKey, normalizeToTokens(fileBase));
}

const azerbaijanEventImageMap = new Map<string, string>();
const azerbaijanEventImageTokens = new Map<string, string[]>();

for (const fileName of azerbaijanEventFileNames) {
  const fileBase = fileName.replace(/\.[^.]+$/, '');
  const normalizedKey = normalizeKey(fileBase);
  azerbaijanEventImageMap.set(normalizedKey, fileName);
  azerbaijanEventImageTokens.set(normalizedKey, normalizeToTokens(fileBase));
}

const titleAliases: Record<string, string> = {
  'independence day': 'pakistan independence day heritage celebrations',
  'quaid e azam day': 'quaid day',
  'pakistan day (1)': 'pakistan day 1',
  'horse and cattle show': 'horse and cattle show',
  'national horse cattle show': 'horse and cattle show',
  'sibi mela near quetta balochistan': 'sibi mela',
};

function buildImageUrl(fileName: string, folder: string) {
  const encodedPath = [folder, fileName].map(encodeURIComponent).join('/');
  return `${IMAGE_PREFIX}/${encodedPath}`;
}

function findBestEventImageFile(title: string, eventImageMap: Map<string, string>, eventImageTokens: Map<string, string[]>): string | null {
  const normalizedTitle = normalizeKey(title);
  if (!normalizedTitle) return null;

  const alias = titleAliases[normalizedTitle];
  if (alias) {
    const aliased = eventImageMap.get(alias);
    if (aliased) return aliased;
  }

  const exactFile = eventImageMap.get(normalizedTitle);
  if (exactFile) return exactFile;

  const titleTokens = normalizeToTokens(title);
  const normalizedTitleWithSpaces = normalizedTitle.replace(/\s+/g, ' ');

  let bestMatch: { file: string; score: number } | null = null;

  for (const [imageKey, fileName] of eventImageMap.entries()) {
    const imageTokens = eventImageTokens.get(imageKey) ?? [];
    const normalizedImageKey = imageKey.replace(/\s+/g, ' ');

    if (normalizedImageKey === normalizedTitleWithSpaces) {
      return fileName;
    }

    if (normalizedImageKey.includes(normalizedTitleWithSpaces) || normalizedTitleWithSpaces.includes(normalizedImageKey)) {
      return fileName;
    }

    const matchedTokens = imageTokens.filter((token) => titleTokens.some((titleToken) => titleToken.includes(token) || token.includes(titleToken)));
    if (matchedTokens.length < 2) continue;
    const score = matchedTokens.length - Math.abs(imageTokens.length - titleTokens.length) * 0.1;

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { file: fileName, score };
    }
  }

  return bestMatch?.file ?? null;
}

export function resolveImageUrlForTitle(title?: string | null) {
  if (!title) return null;

  const fileName = findBestEventImageFile(title, eventImageMap, eventImageTokens);
  if (!fileName) return null;

  return buildImageUrl(fileName, 'Events in Pakistan');
}

export function resolveImageUrlForAzerbaijanEvent(title?: string | null) {
  if (!title) return null;

  const fileName = findBestEventImageFile(title, azerbaijanEventImageMap, azerbaijanEventImageTokens);
  if (!fileName) return null;

  return buildImageUrl(fileName, 'Azerbaijan events images');
}

export function resolveImageUrlForEvent(event: { title?: string | null }) {
  return resolveImageUrlForTitle(event.title);
}
