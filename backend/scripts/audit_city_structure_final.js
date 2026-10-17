require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

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

function profileObject(profile) {
  return profile && typeof profile === 'object' && !Array.isArray(profile) ? profile : {};
}

function isValidValue(value, field) {
  if (value === null) return true;
  if (typeof value === 'string') return true;
  if (ARRAY_FIELDS.has(field)) return Array.isArray(value) && value.every((item) => typeof item === 'string');
  return Array.isArray(value) ? value.every((item) => typeof item === 'string') : false;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const cities = await prisma.city.findMany({ select: { slug: true, name: true, countryCode: true, profile: true }, orderBy: { slug: 'asc' } });
    const pakistanProfiles = cities
      .filter((city) => city.countryCode.trim().toUpperCase() === 'PK')
      .map((city) => profileObject(city.profile));
    const pakistanJson = new Set(pakistanProfiles.map((profile) => JSON.stringify(profile)));
    const rows = [];
    let complete = 0;
    let missing = 0;
    let extra = 0;
    let invalidNested = 0;
    let pakistanCopies = 0;

    for (const city of cities) {
      const profile = profileObject(city.profile);
      const keys = Object.keys(profile);
      const missingFields = CANONICAL_FIELDS.filter((field) => !Object.prototype.hasOwnProperty.call(profile, field));
      const extraFields = keys.filter((field) => !CANONICAL_FIELDS.includes(field));
      const invalidFields = CANONICAL_FIELDS.filter((field) => Object.prototype.hasOwnProperty.call(profile, field) && !isValidValue(profile[field], field));
      const copiedPakistanData = city.countryCode.trim().toUpperCase() !== 'PK' && pakistanJson.has(JSON.stringify(profile));
      const status = extraFields.length || invalidFields.length ? 'INVALID STRUCTURE' : missingFields.length ? 'MISSING FIELDS' : 'COMPLETE';
      if (status === 'COMPLETE') complete += 1;
      if (status === 'MISSING FIELDS') missing += 1;
      if (status === 'INVALID STRUCTURE') extra += 1;
      if (invalidFields.length) invalidNested += 1;
      if (copiedPakistanData) pakistanCopies += 1;
      rows.push({ slug: city.slug, name: city.name, countryCode: city.countryCode, present: CANONICAL_FIELDS.length - missingFields.length, missing: missingFields.length, extra: extraFields.length, invalidNested: invalidFields.length, status });
    }

    console.log('CANONICAL_CITY_FIELDS', CANONICAL_FIELDS.length);
    console.log('TOTAL_CITIES', cities.length);
    console.log('CITIES_AUDITED', rows.length);
    console.log('CITIES_COMPLETE', complete);
    console.log('CITIES_MISSING_FIELDS', missing);
    console.log('CITIES_WITH_EXTRA_FIELDS', extra);
    console.log('CITIES_WITH_INVALID_NESTED_VALUES', invalidNested);
    console.log('PAKISTAN_DATA_COPIES_INTO_OTHER_CITIES', pakistanCopies);
    for (const code of ['PK', 'AF', 'IN', 'AR', 'FR', 'JP', 'ZA']) {
      const examples = rows.filter((row) => row.countryCode === code).slice(0, 2);
      for (const example of examples) console.log(JSON.stringify(example));
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('FINAL_CITY_AUDIT_FAILED');
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
