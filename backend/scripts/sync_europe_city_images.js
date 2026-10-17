require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const IMAGE_DIR = path.join(__dirname, '..', 'public', 'Images', 'Europe cities images');
const IMAGE_PREFIX = '/images/Europe%20cities%20images/';
const PLACEHOLDER_SLUGS = new Set([
  'ad-none',
  'fr-ecologie-gouv-fr',
  'li-none',
  'mc-none',
  'sm-none',
  'ua-none-ukraine-currently-has-no-operational-airports-offering-scheduled-international-passenger-flights-because-civilian-passenger-airspace-remains-closed',
  'va-none',
]);
const STOP_WORDS = new Set([
  'airport', 'air', 'international', 'national', 'regional', 'city', 'view', 'heliport', 'airports',
  'the', 'of', 'de', 'la', 'le', 'da', 'di', 'a', 'an', 'and', 'for', 's', 'is', 'on', 'to', 'at',
  'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'
]);

function normalize(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[æ]/g, 'ae')
    .replace(/[œ]/g, 'oe')
    .replace(/[ø]/g, 'o')
    .replace(/[ł]/g, 'l')
    .replace(/[ß]/g, 'ss')
    .replace(/[đ]/g, 'd')
    .replace(/[þ]/g, 'th')
    .replace(/[–—]/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokens(value) {
  return normalize(value).split(/\s+/).filter(Boolean).filter((token) => !STOP_WORDS.has(token));
}

function fileMeta(fileName) {
  const base = path.basename(fileName, path.extname(fileName));
  const normalizedBase = normalize(base);
  return {
    fileName,
    base,
    normalizedBase,
    tokens: tokens(base),
    isCityView: /city-view/i.test(base),
    isAirport: /airport/i.test(base),
    isPlaceholder: /none|placeholder|generic/i.test(base),
  };
}

function scoreCandidate(city, fileName) {
  const { base, normalizedBase, tokens: fileTokens, isCityView, isAirport, isPlaceholder } = fileMeta(fileName);
  const strippedCountryPrefix = city.slug.replace(new RegExp(`^${city.countryCode}-`, 'i'), '');
  const cityNameNorm = normalize(city.name);
  const slugNorm = normalize(strippedCountryPrefix);
  const cityTokens = tokens(`${city.name} ${strippedCountryPrefix}`);
  let score = 0;

  if (normalizedBase.includes(cityNameNorm)) score += 120;
  if (normalizedBase.includes(slugNorm)) score += 80;
  if (normalizedBase === cityNameNorm || normalizedBase === slugNorm) score += 90;

  const overlap = new Set(cityTokens.filter((token) => fileTokens.includes(token))).size;
  score += overlap * 40;
  if (fileTokens.length && cityTokens.length) {
    score += (overlap / Math.max(fileTokens.length, cityTokens.length)) * 40;
  }

  if (isCityView) score += 55;
  if (isAirport) score -= 90;
  if (isPlaceholder) score -= 500;
  if (!cityTokens.length) score -= 50;

  return { fileName, score, overlap, base, cityTokens, fileTokens };
}

async function main() {
  const europeCountries = await prisma.country.findMany({
    where: { continent: { name: 'Europe' } },
    select: { code: true },
  });
  const countryCodes = europeCountries.map((country) => country.code);
  const cities = await prisma.city.findMany({
    where: { countryCode: { in: countryCodes } },
    select: { slug: true, name: true, countryCode: true, profile: true },
    orderBy: [{ countryCode: 'asc' }, { slug: 'asc' }],
  });

  const files = fs.readdirSync(IMAGE_DIR)
    .filter((fileName) => !fileName.endsWith('.part'))
    .filter((fileName) => /\.(jpe?g|png|webp)$/i.test(fileName));

  let updatedCount = 0;
  let placeholderCount = 0;
  const missing = [];

  for (const city of cities) {
    const profile = city.profile && typeof city.profile === 'object' && !Array.isArray(city.profile) ? { ...city.profile } : {};
    const isPlaceholder = PLACEHOLDER_SLUGS.has(city.slug) || /^none$/i.test(String(city.name || '').trim()) || /no operational airports|currently has no operational/i.test(String(city.name || '')) || /\(ecologie\.gouv\.fr\)/i.test(String(city.name || ''));

    if (isPlaceholder) {
      if (profile.heroImageUrl) {
        profile.heroImageUrl = null;
        await prisma.city.update({ where: { slug: city.slug }, data: { profile } });
        updatedCount += 1;
      }
      placeholderCount += 1;
      missing.push({ countryCode: city.countryCode, slug: city.slug, name: city.name, issue: 'placeholder-record' });
      continue;
    }

    const scored = files
      .map((fileName) => scoreCandidate(city, fileName))
      .sort((a, b) => b.score - a.score || b.overlap - a.overlap);
    const chosen = scored[0];

    if (!chosen || chosen.score <= 60) {
      missing.push({ countryCode: city.countryCode, slug: city.slug, name: city.name, issue: 'no-local-match' });
      continue;
    }

    const localImagePath = `${IMAGE_PREFIX}${encodeURIComponent(chosen.fileName)}`;
    if (profile.heroImageUrl !== localImagePath) {
      profile.heroImageUrl = localImagePath;
      await prisma.city.update({ where: { slug: city.slug }, data: { profile } });
      updatedCount += 1;
    }
  }

  const finalCityRows = await prisma.city.findMany({
    where: { countryCode: { in: countryCodes } },
    select: { slug: true, name: true, countryCode: true, profile: true },
  });
  const mappedCount = finalCityRows.filter((city) => {
    const profile = city.profile && typeof city.profile === 'object' && !Array.isArray(city.profile) ? city.profile : {};
    return typeof profile.heroImageUrl === 'string' && profile.heroImageUrl.trim().startsWith('/images/Europe%20cities%20images/');
  }).length;

  console.log(JSON.stringify({
    europeCountryCount: countryCodes.length,
    europeCityCount: finalCityRows.length,
    mappedWithEuropeLocalImages: mappedCount,
    placeholderRecordsCleared: placeholderCount,
    citiesUpdated: updatedCount,
    missingMatches: missing.length,
    missingList: missing.slice(0, 20),
  }, null, 2));
}

main().catch((error) => {
  console.error('EUROPE_CITY_IMAGE_SYNC_FAILED');
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
