require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CANONICAL_FIELDS = [
  'airport', 'area', 'arts', 'busNetwork', 'climate', 'coordinates', 'country', 'culturalEvents',
  'elevation', 'famousLandmarks', 'famousPeople', 'festivals', 'finance', 'flagImageUrl', 'founded',
  'heroImageUrl', 'historicalSignificance', 'history', 'interestingFacts', 'majorIndustries', 'majorRoads',
  'manufacturing', 'metro', 'moviesFilmedHere', 'museums', 'music', 'nickname', 'overview', 'parks',
  'popularRestaurants', 'population', 'postalCode', 'railway', 'rivers', 'shortDescription', 'sources',
  'sports', 'stadiums', 'streetFood', 'surprisingFacts', 'technology', 'thumbnail', 'timeZone', 'tourism',
  'traditionalFood', 'tvShows', 'unescoSites', 'uniqueCustoms', 'uniqueTransportation', 'worldRecords',
];

const ARRAY_FIELDS = new Set(['sources']);

function sourceObject(profile) {
  return profile && typeof profile === 'object' && !Array.isArray(profile) ? profile : {};
}

function normalizeValue(value, field) {
  if (value === null || value === undefined) return ARRAY_FIELDS.has(field) ? [] : null;
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== null && item !== undefined && String(item).trim() !== '')
      .map((item) => typeof item === 'string' ? item.trim() : item);
  }
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
}

function normalizeProfile(profile) {
  const source = sourceObject(profile);
  const normalized = {};
  for (const field of CANONICAL_FIELDS) {
    normalized[field] = normalizeValue(source[field], field);
  }
  return normalized;
}

function sameJsonShape(before, after) {
  return JSON.stringify(before) === JSON.stringify(after);
}

async function main() {
  const cities = await prisma.city.findMany({
    select: { slug: true, name: true, countryCode: true, profile: true },
    orderBy: { slug: 'asc' },
  });
  let fixed = 0;

  for (const city of cities) {
    const normalized = normalizeProfile(city.profile);
    if (!sameJsonShape(city.profile, normalized)) fixed += 1;
    await prisma.city.update({ where: { slug: city.slug }, data: { profile: normalized } });
  }

  console.log('CANONICAL_CITY_FIELDS', CANONICAL_FIELDS.length);
  console.log('TOTAL_CITIES', cities.length);
  console.log('CITIES_FIXED', fixed);
}

main()
  .catch((error) => {
    console.error('CITY_PROFILE_FIX_FAILED');
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
