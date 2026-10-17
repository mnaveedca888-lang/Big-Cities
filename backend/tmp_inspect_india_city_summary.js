const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const requiredFields = [
  'heroImageUrl','shortDescription','overview','history','founded','historicalSignificance','area','elevation','rivers','climate','coordinates','unescoSites','famousLandmarks','museums','parks','traditionalFood','streetFood','popularRestaurants','festivals','culturalEvents','arts','music','majorIndustries','technology','tourism','manufacturing','finance','metro','airport','railway','busNetwork','majorRoads','moviesFilmedHere','tvShows','sports','stadiums','famousPeople','nickname','worldRecords','interestingFacts','uniqueCustoms','uniqueTransportation','surprisingFacts','timeZone','postalCode','population'
];

function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0 || value.every(isEmpty);
  if (typeof value === 'string') {
    const s = value.trim();
    return s === '' || s === '—' || /varies by area/i.test(s) || /no major metro system listed/i.test(s) || /population estimates for/i.test(s) || /the city experiences a regional indian climate/i.test(s) || /major highways and arterial roads connect this city/i.test(s) || /local transport in .* includes buses/i.test(s) || /rail connections link this city/i.test(s) || /nearest airport serves the city/i.test(s) || /transport options include/i.test(s);
  }
  return false;
}

(async () => {
  const cities = await prisma.city.findMany({
    where: { countryCode: 'IN' },
    orderBy: { slug: 'asc' },
    select: { slug: true, name: true, profile: true },
  });
  const report = cities.map((city) => {
    const missing = requiredFields.filter((field) => isEmpty(city.profile?.[field]));
    return { slug: city.slug, name: city.name, missingCount: missing.length, missing };
  }).sort((a, b) => a.missingCount - b.missingCount);
  const complete = report.filter((r) => r.missingCount === 0).length;
  console.log(`complete ${complete} of ${report.length}`);
  report.forEach((r) => {
    console.log(`${r.slug}|${r.name}|${r.missingCount}`);
  });
  await prisma.$disconnect();
})();
