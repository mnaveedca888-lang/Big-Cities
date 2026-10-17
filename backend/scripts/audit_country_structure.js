require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const canonical = [
  'heroImageUrl',
  'flagImageUrl',
  'shortDescription',
  'overview',
  'geography',
  'economy',
  'government',
  'founded',
  'independence',
  'capital',
  'historicalSignificance',
  'importantHistoricalEvents',
  'highestMountain',
  'lowestPoint',
  'majorRivers',
  'lakes',
  'coastline',
  'nationalParks',
  'climateOverview',
  'hottestRegion',
  'coldestRegion',
  'wettestRegion',
  'seasons',
  'famousFoods',
  'traditionalDress',
  'sports',
  'music',
  'culturalHeritage',
  'unescoWorldHeritageSites',
  'famousLandmarks',
  'museums',
  'religiousPlaces',
  'touristAttractions',
  'airports',
  'railways',
  'metro',
  'motorways',
  'population',
  'gdp',
  'literacyRate',
  'lifeExpectancy',
  'area',
  'currency',
  'callingCode',
  'internetUsers',
  'drivingSide',
  'interestingFacts',
  'sources',
];

async function main() {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    const countries = await prisma.country.findMany({
      select: { code: true, name: true, profile: true },
      orderBy: { name: 'asc' },
    });

    const rows = [];
    let complete = 0;
    let missingFields = 0;
    let invalid = 0;

    for (const country of countries) {
      const profile = country.profile && typeof country.profile === 'object' && !Array.isArray(country.profile) ? country.profile : {};
      const keys = Object.keys(profile);
      const present = canonical.filter((key) => Object.prototype.hasOwnProperty.call(profile, key));
      const missing = canonical.filter((key) => !Object.prototype.hasOwnProperty.call(profile, key));
      const extra = keys.filter((key) => !canonical.includes(key));

      let status = 'COMPLETE';
      if (extra.length > 0) status = 'INVALID STRUCTURE';
      else if (missing.length > 0) status = 'MISSING FIELDS';

      if (status === 'COMPLETE') complete += 1;
      if (status === 'MISSING FIELDS') missingFields += 1;
      if (status === 'INVALID STRUCTURE') invalid += 1;

      rows.push({
        code: country.code,
        name: country.name,
        present: present.length,
        missing: missing.length,
        extra: extra.length,
        missingFields: missing.slice(0, 10),
        extraFields: extra.slice(0, 10),
        status,
      });
    }

    console.log('CANONICAL_FIELDS', canonical.length);
    console.log('COUNTRIES_IN_DATABASE', countries.length);
    console.log('COUNTRIES_AUDITED', countries.length);
    console.log('COUNTRIES_COMPLETE', complete);
    console.log('COUNTRIES_MISSING_FIELDS', missingFields);
    console.log('COUNTRIES_WITH_EXTRA_FIELDS', invalid);
    console.log('COUNTRIES_FIXED', 0);
    for (const row of rows.slice(0, 15)) {
      console.log(JSON.stringify(row));
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('AUDIT_FAILED');
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
