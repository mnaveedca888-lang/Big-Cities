import fs from 'fs';
import path from 'path';
import { localImageUrl } from '../images/local-image';

const PAKISTAN_IMAGES_DIR = path.join(__dirname, '..', '..', 'public', 'Images', 'Events in Pakistan');
const AZERBAIJAN_IMAGES_DIR = path.join(__dirname, '..', '..', 'public', 'Images', 'Azerbaijan events images');

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

const eventImageMap = new Map<string, string>();

for (const fileName of pakistaniEventFileNames) {
  const fileBase = fileName.replace(/\.[^.]+$/, '');
  const normalizedKey = normalizeKey(fileBase);
  eventImageMap.set(normalizedKey, fileName);
}

const azerbaijanEventImageMap = new Map<string, string>();

for (const fileName of azerbaijanEventFileNames) {
  const fileBase = fileName.replace(/\.[^.]+$/, '');
  const normalizedKey = normalizeKey(fileBase);
  azerbaijanEventImageMap.set(normalizedKey, fileName);
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
  return localImageUrl(folder, fileName);
}

function findEventImageFile(title: string, eventImageMap: Map<string, string>): string | null {
  const normalizedTitle = normalizeKey(title);
  if (!normalizedTitle) return null;

  const alias = titleAliases[normalizedTitle];
  if (alias) {
    const aliased = eventImageMap.get(alias);
    if (aliased) return aliased;
  }

  return eventImageMap.get(normalizedTitle) ?? null;
}

export function resolveImageUrlForTitle(title?: string | null) {
  if (!title) return null;

  const fileName = findEventImageFile(title, eventImageMap);
  if (!fileName) return null;

  return buildImageUrl(fileName, 'Events in Pakistan');
}

export function resolveImageUrlForAzerbaijanEvent(title?: string | null) {
  if (!title) return null;

  const fileName = findEventImageFile(title, azerbaijanEventImageMap);
  if (!fileName) return null;

  return buildImageUrl(fileName, 'Azerbaijan events images');
}

export function resolveImageUrlForEvent(event: { title?: string | null }) {
  return resolveImageUrlForTitle(event.title);
}
