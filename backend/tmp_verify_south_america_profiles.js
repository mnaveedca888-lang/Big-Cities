const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const countryCodes = ['AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'GY', 'PY', 'PE', 'SR', 'UY', 'VE'];
const required = [
  'population',
  'nickname',
  'overview',
  'history',
  'founded',
  'historicalSignificance',
  'area',
  'elevation',
  'rivers',
  'climate',
  'coordinates',
  'unescoSites',
  'famousLandmarks',
  'museums',
  'parks',
  'traditionalFood',
  'streetFood',
  'popularRestaurants',
  'festivals',
  'culturalEvents',
  'arts',
  'music',
  'majorIndustries',
  'technology',
  'tourism',
  'manufacturing',
  'finance',
  'metro',
  'airport',
  'railway',
  'busNetwork',
  'majorRoads',
  'moviesFilmedHere',
  'tvShows',
  'sports',
  'stadiums',
  'famousPeople',
  'worldRecords',
  'interestingFacts',
  'uniqueCustoms',
  'uniqueTransportation',
  'surprisingFacts',
  'timeZone',
  'postalCode',
  'shortDescription',
  'country',
  'sources',
];

async function main() {
  const cities = await prisma.city.findMany({
    where: { countryCode: { in: countryCodes } },
    orderBy: { slug: 'asc' },
    select: { slug: true, name: true, countryCode: true, profile: true },
  });

  const incomplete = [];
  for (const city of cities) {
    const profile = city.profile && typeof city.profile === 'object' ? city.profile : {};
    const missing = required.filter((key) => !profile[key] || profile[key] === '—' || profile[key] === '');
    if (missing.length) {
      incomplete.push({ slug: city.slug, name: city.name, countryCode: city.countryCode, missing: missing.slice(0, 12) });
    }
  }

  console.log(`totalCities=${cities.length}`);
  console.log(`incompleteCities=${incomplete.length}`);
  if (incomplete.length) {
    console.log(JSON.stringify(incomplete.slice(0, 20), null, 2));
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
