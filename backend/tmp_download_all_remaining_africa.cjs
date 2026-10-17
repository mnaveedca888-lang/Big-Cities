const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const imageDir = path.join(process.cwd(), 'public', 'Images', 'Africa cities images');
fs.mkdirSync(imageDir, { recursive: true });

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function makeQueries(city) {
  const names = new Set();
  names.add(city.name);
  names.add(city.name.replace(/\s*[-–]airport\b/gi, ''));
  names.add(city.name.replace(/\s*international\s*airport\b/gi, ''));
  names.add(city.name.replace(/\s*airport\b/gi, ''));
  names.add(city.name.replace(/\s*intl\b/gi, ''));
  const slug = slugify(city.name);
  if (slug) names.add(slug.replace(/-airport$/, ''));
  const base = city.name.replace(/[()]/g, '').trim();
  if (base) names.add(base);
  const variants = Array.from(names).filter(Boolean);
  return variants.slice(0, 6);
}

async function fetchOpenverseCandidates(query) {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&license=by,by-sa,cc0,pdm&page_size=5`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'BigCitiesAfrica/1.0' },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json.results) ? json.results : [];
}

async function saveCityImage(fileName, imageUrl) {
  const response = await fetch(imageUrl, {
    headers: { 'User-Agent': 'BigCitiesAfrica/1.0' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const webp = await sharp(buffer)
    .rotate()
    .resize({ width: 1600, height: 1200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  fs.writeFileSync(path.join(imageDir, fileName), webp);
  return true;
}

(async () => {
  const africaCountries = await prisma.country.findMany({
    where: { continent: { name: 'Africa' } },
    select: { code: true },
  });
  const codes = africaCountries.map((c) => c.code);
  const cities = await prisma.city.findMany({
    where: { countryCode: { in: codes } },
    select: { slug: true, name: true, countryCode: true, profile: true },
    orderBy: [{ countryCode: 'asc' }, { name: 'asc' }],
  });

  let downloaded = 0;
  let skipped = 0;
  let total = 0;

  for (const city of cities) {
    const profile = city.profile && typeof city.profile === 'object' && !Array.isArray(city.profile) ? city.profile : {};
    const hasImage = !!(profile.heroImageUrl || profile.thumbnail || profile.image);
    if (hasImage) continue;

    total += 1;
    const queries = makeQueries(city);
    let found = false;

    for (const query of queries) {
      try {
        const results = await fetchOpenverseCandidates(query);
        const directCandidates = results
          .map((r) => r?.url)
          .filter((url) => typeof url === 'string' && /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url));
        if (!directCandidates.length) continue;

        for (const directUrl of directCandidates) {
          const fileName = `${city.slug.toLowerCase()}.webp`;
          const finalPath = path.join(imageDir, fileName);
          if (fs.existsSync(finalPath)) {
            found = true;
            downloaded += 1;
            break;
          }
          try {
            await saveCityImage(fileName, directUrl);
            console.log(`downloaded ${city.slug} via ${query} -> ${fileName}`);
            downloaded += 1;
            found = true;
            break;
          } catch (error) {
            // keep trying other direct candidates
          }
        }
      } catch (error) {
        // keep trying other queries
      }
      if (found) break;
    }

    if (!found) {
      skipped += 1;
      console.log(`no downloadable source found for ${city.slug} (${city.name})`);
    }
  }

  console.log(JSON.stringify({ totalMissingBefore: total, downloaded, skipped }, null, 2));
  await prisma.$disconnect();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
