import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { resolveImageUrlForTitle } from './src/events/event-image';

const prisma = new PrismaClient();
const imagesRoot = path.join(__dirname, 'public', 'Images');
const eventImagesDir = path.join(imagesRoot, 'Events in Pakistan');
const pakistanImagesDir = path.join(imagesRoot, 'Pakistan images');

function parsePakistanCityMapping() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'utils', 'pakistanImages.ts'), 'utf-8');
  const mapping: Record<string, string> = {};
  const regex = /['"](pk-[^'"\s]+)['"]\s*:\s*`[^`]*['"]([^'"\s]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(source)) !== null) {
    mapping[match[1].trim().toLowerCase()] = match[2].trim();
  }
  return mapping;
}

async function main() {
  const eventFiles = fs.existsSync(eventImagesDir)
    ? fs.readdirSync(eventImagesDir).filter((fileName) => /\.(jpe?g|png|webp)$/i.test(fileName))
    : [];
  const pakistanFiles = fs.existsSync(pakistanImagesDir)
    ? fs.readdirSync(pakistanImagesDir).filter((fileName) => /\.(jpe?g|png|webp)$/i.test(fileName))
    : [];

  console.log('EVENT IMAGES:', eventFiles.length);
  console.log('PAKISTAN IMAGE FILES:', pakistanFiles.length);

  const events = await prisma.event.findMany({ where: { countryCode: 'PK' }, select: { slug: true, title: true } });
  const cities = await prisma.city.findMany({ where: { countryCode: 'PK' }, select: { slug: true, name: true } });
  const countries = await prisma.country.findMany({ where: { code: 'PK' }, select: { code: true, name: true } });

  console.log('DB EVENTS:', events.length);
  console.log('DB CITIES:', cities.length);
  console.log('DB COUNTRIES:', countries.length);

  const eventMismatches: Array<{ slug: string; title: string; reason: string; imageUrl?: string }> = [];
  for (const event of events) {
    const imageUrl = resolveImageUrlForTitle(event.title);
    if (!imageUrl) {
      eventMismatches.push({ slug: event.slug, title: event.title ?? '', reason: 'No resolver match' });
      continue;
    }

    const urlParts = imageUrl.split('/images/').pop();
    if (!urlParts) {
      eventMismatches.push({ slug: event.slug, title: event.title ?? '', reason: 'Invalid image URL', imageUrl });
      continue;
    }

    const decoded = decodeURIComponent(urlParts);
    const imagePath = path.join(imagesRoot, decoded);
    if (!fs.existsSync(imagePath)) {
      eventMismatches.push({ slug: event.slug, title: event.title ?? '', reason: `Static file missing: ${decoded}`, imageUrl });
    }
  }

  const cityMapping = parsePakistanCityMapping();
  const cityMismatches: Array<{ slug: string; name: string; reason: string }> = [];
  for (const city of cities) {
    const key = city.slug.trim().toLowerCase();
    const fileName = cityMapping[key];
    if (!fileName) {
      cityMismatches.push({ slug: city.slug, name: city.name ?? '', reason: 'No city image mapping in frontend util' });
      continue;
    }
    if (!pakistanFiles.includes(fileName)) {
      cityMismatches.push({ slug: city.slug, name: city.name ?? '', reason: `Mapped file missing: ${fileName}` });
    }
  }

  const countryMismatches: Array<{ code: string; name: string; reason: string }> = [];
  const expectedCountryFile = 'Pakistan.jpg';
  if (!pakistanFiles.includes(expectedCountryFile)) {
    countryMismatches.push({ code: 'PK', name: countries[0]?.name ?? 'Pakistan', reason: `${expectedCountryFile} missing from Pakistan images` });
  }

  if (eventMismatches.length === 0 && cityMismatches.length === 0 && countryMismatches.length === 0) {
    console.log('ALL IMAGE MATCHES OK.');
  } else {
    if (eventMismatches.length > 0) {
      console.log('\nEVENT MISMATCHES:', eventMismatches.length);
      for (const mismatch of eventMismatches) {
        console.log('---');
        console.log(`Database: ${mismatch.title}`);
        console.log(`Slug: ${mismatch.slug}`);
        console.log(`Reason: ${mismatch.reason}`);
        if (mismatch.imageUrl) console.log(`URL: ${mismatch.imageUrl}`);
      }
    }
    if (cityMismatches.length > 0) {
      console.log('\nCITY MISMATCHES:', cityMismatches.length);
      for (const mismatch of cityMismatches) {
        console.log('---');
        console.log(`Database: ${mismatch.name}`);
        console.log(`Slug: ${mismatch.slug}`);
        console.log(`Reason: ${mismatch.reason}`);
      }
    }
    if (countryMismatches.length > 0) {
      console.log('\nCOUNTRY MISMATCHES:', countryMismatches.length);
      for (const mismatch of countryMismatches) {
        console.log('---');
        console.log(`Database: ${mismatch.name}`);
        console.log(`Code: ${mismatch.code}`);
        console.log(`Reason: ${mismatch.reason}`);
      }
    }
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
