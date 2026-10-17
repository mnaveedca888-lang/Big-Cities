const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const requiredFields = [
  'heroImageUrl',
  'shortDescription',
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
  'nickname',
  'worldRecords',
  'interestingFacts',
  'uniqueCustoms',
  'uniqueTransportation',
  'surprisingFacts',
  'timeZone',
  'postalCode',
  'population'
];

function isEmptyValue(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') {
    const s = value.trim();
    return s === '' || s === '—' || s.toLowerCase().includes('varies by area') || s.toLowerCase().includes('no major metro system listed.') || s.toLowerCase().includes('population estimates for') || s.toLowerCase().includes('the city experiences a regional indian climate') || s.toLowerCase().includes('major highways and arterial roads connect this city');
  }
  if (Array.isArray(value)) return value.length === 0 || value.every(isEmptyValue);
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

(async () => {
  try {
    const cities = await prisma.city.findMany({
      where: { countryCode: 'IN' },
      orderBy: { slug: 'asc' },
      select: { slug: true, name: true, profile: true },
    });
    const report = [];
    for (const city of cities) {
      const missing = [];
      const profile = city.profile || {};
      for (const field of requiredFields) {
        const value = profile[field];
        if (isEmptyValue(value)) {
          missing.push(field);
        }
      }
      report.push({ slug: city.slug, name: city.name, missing, countMissing: missing.length });
    }
    console.log(JSON.stringify(report, null, 2));
    const total = report.filter((item) => item.countMissing === 0).length;
    console.log('completeCount:', total, 'of', report.length);
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
