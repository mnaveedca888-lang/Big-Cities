import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const imagesRoot = path.join(__dirname, 'public', 'Images');
const eventImagesDir = path.join(imagesRoot, 'Events in Pakistan');
const pakistanImagesDir = path.join(imagesRoot, 'Pakistan images');

function normalizeValue(value: string) {
  return String(value)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[-_&]/g, ' ')
    .replace(/[^a-z0-9'" ]+/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

function listImageFiles(directory: string) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter((file) => /\.(jpe?g|png|webp)$/i.test(file));
}

function buildNormalizedLookup(files: string[]) {
  return new Map(files.map((file) => [normalizeValue(file.replace(/\.[^.]+$/, '')), file]));
}

async function main() {
  const eventFiles = listImageFiles(eventImagesDir);
  const cityFiles = listImageFiles(pakistanImagesDir);

  console.log('EVENT IMAGES:', eventFiles.length);
  console.log('CITY/COUNTRY IMAGES:', cityFiles.length);

  const eventImageLookup = buildNormalizedLookup(eventFiles);
  const cityImageLookup = buildNormalizedLookup(cityFiles);

  const events = await prisma.event.findMany({ where: { countryCode: 'PK' }, select: { id: true, slug: true, title: true } });
  const cities = await prisma.city.findMany({ where: { countryCode: 'PK' }, select: { slug: true, name: true } });
  const countries = await prisma.country.findMany({ where: { code: 'PK' }, select: { code: true, name: true } });

  console.log('DATABASE EVENTS:', events.length);
  console.log('DATABASE CITIES:', cities.length);
  console.log('DATABASE COUNTRIES:', countries.length);

  const eventReport: Array<{ title: string; slug: string; file?: string; status: string }> = [];
  const unmatchedEventFiles = new Set(eventFiles);

  for (const event of events) {
    const title = event.title ?? '';
    const normalizedTitle = normalizeValue(title);
    let file = eventImageLookup.get(normalizedTitle);

    if (!file) {
      // fallback: find any image file with a normalized name that contains the normalized title or vice versa
      file = eventFiles.find((fileName) => {
        const normalizedFile = normalizeValue(fileName.replace(/\.[^.]+$/, ''));
        return normalizedFile === normalizedTitle || normalizedFile.includes(normalizedTitle) || normalizedTitle.includes(normalizedFile);
      });
    }

    if (file) {
      unmatchedEventFiles.delete(file);
      eventReport.push({ title, slug: event.slug, file, status: 'Match' });
    } else {
      eventReport.push({ title, slug: event.slug, file: undefined, status: 'Mismatch' });
    }
  }

  const cityReport: Array<{ name: string; slug: string; file?: string; status: string }> = [];
  const unmatchedCityFiles = new Set(cityFiles);

  for (const city of cities) {
    const normalizedName = normalizeValue(city.name ?? '');
    let file = cityImageLookup.get(normalizedName);

    if (!file) {
      file = cityFiles.find((fileName) => {
        const normalizedFile = normalizeValue(fileName.replace(/\.[^.]+$/, ''));
        return normalizedFile === normalizedName || normalizedFile.includes(normalizedName) || normalizedName.includes(normalizedFile);
      });
    }

    if (file) {
      unmatchedCityFiles.delete(file);
      cityReport.push({ name: city.name ?? '', slug: city.slug, file, status: 'Match' });
    } else {
      cityReport.push({ name: city.name ?? '', slug: city.slug, status: 'Mismatch' });
    }
  }

  const countryReport: Array<{ name: string; code: string; file?: string; status: string }> = [];
  for (const country of countries) {
    const normalizedName = normalizeValue(country.name ?? '');
    let file = cityImageLookup.get(normalizedName);
    if (!file) {
      file = cityFiles.find((fileName) => {
        const normalizedFile = normalizeValue(fileName.replace(/\.[^.]+$/, ''));
        return normalizedFile === normalizedName || normalizedFile.includes(normalizedName) || normalizedName.includes(normalizedFile);
      });
    }
    if (file) {
      countryReport.push({ name: country.name ?? '', code: country.code, file, status: 'Match' });
    } else {
      countryReport.push({ name: country.name ?? '', code: country.code, status: 'Mismatch' });
    }
  }

  console.log('\nEVENT REPORT');
  for (const row of eventReport) {
    if (row.status === 'Mismatch') {
      console.log('---');
      console.log(`Database: ${row.title}`);
      console.log(`Slug: ${row.slug}`);
      console.log('Filename: NONE');
      console.log(`Status: ${row.status}`);
    }
  }

  console.log('\nCITY REPORT');
  for (const row of cityReport) {
    if (row.status === 'Mismatch') {
      console.log('---');
      console.log(`Database: ${row.name}`);
      console.log(`Slug: ${row.slug}`);
      console.log('Filename: NONE');
      console.log(`Status: ${row.status}`);
    }
  }

  console.log('\nCOUNTRY REPORT');
  for (const row of countryReport) {
    console.log('---');
    console.log(`Database: ${row.name}`);
    console.log(`Code: ${row.code}`);
    console.log(`Filename: ${row.file ?? 'NONE'}`);
    console.log(`Status: ${row.status}`);
  }

  console.log('\nUNMATCHED EVENT FILES:');
  console.log(Array.from(unmatchedEventFiles).sort().join('\n'));
  console.log('\nUNMATCHED CITY FILES:');
  console.log(Array.from(unmatchedCityFiles).sort().join('\n'));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
