import http from 'http';
import { PrismaClient } from '@prisma/client';
import { resolveImageUrlForTitle } from './src/events/event-image';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const apiHost = '127.0.0.1';
const apiPort = 4000;

function checkUrl(url: string): Promise<{ url: string; status: number | null; error?: string }> {
  return new Promise((resolve) => {
    const req = http.get({ host: apiHost, port: apiPort, path: url, method: 'GET' }, (res) => {
      res.resume();
      resolve({ url, status: res.statusCode ?? null });
    });
    req.on('error', (err) => resolve({ url, status: null, error: err.message }));
    req.setTimeout(10000, () => {
      req.destroy(new Error('timeout'));
      resolve({ url, status: null, error: 'timeout' });
    });
  });
}

async function main() {
  const events = await prisma.event.findMany({ where: { countryCode: 'PK' }, select: { slug: true, title: true } });
  const citySource = fs.readFileSync(path.join(__dirname, '..', 'src', 'utils', 'pakistanImages.ts'), 'utf-8');
  const cityMap: Record<string, string> = {};
  const regex = /['"](pk-[^'"\s]+)['"]\s*:\s*`[^`]*['"]([^'"\s]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(citySource)) !== null) {
    cityMap[match[1].toLowerCase()] = match[2];
  }

  const eventChecks = [];
  for (const event of events) {
    const url = resolveImageUrlForTitle(event.title);
    if (!url) {
      eventChecks.push({ url: `MISSING for ${event.slug}`, status: null, error: 'no image url' });
      continue;
    }
    eventChecks.push(await checkUrl(url));
  }

  const cityChecks = [];
  for (const [slug, fileName] of Object.entries(cityMap)) {
    const url = `/images/${encodeURIComponent('Pakistan images')}/${encodeURIComponent(fileName)}`;
    cityChecks.push({ slug, fileName, ...(await checkUrl(url)) });
  }

  const countryUrl = `/images/${encodeURIComponent('Pakistan images')}/${encodeURIComponent('Pakistan.jpg')}`;
  const countryCheck = await checkUrl(countryUrl);

  await prisma.$disconnect();

  const failedEvents = eventChecks.filter((check) => check.status !== 200);
  const failedCities = cityChecks.filter((check) => check.status !== 200);
  const failedCountry = countryCheck.status !== 200 ? [countryCheck] : [];

  console.log('EVENTS TOTAL:', eventChecks.length);
  console.log('EVENT FAILURES:', failedEvents.length);
  for (const f of failedEvents.slice(0, 20)) console.log(f);
  console.log('CITIES TOTAL:', cityChecks.length);
  console.log('CITY FAILURES:', failedCities.length);
  for (const f of failedCities) console.log(f);
  console.log('COUNTRY:', countryCheck);
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
