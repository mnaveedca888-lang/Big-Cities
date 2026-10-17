const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  await prisma.$connect();
  const total = await prisma.city.count();
  const airportNames = await prisma.city.findMany({
    where: { name: { contains: 'Airport', mode: 'insensitive' } },
    select: { slug: true, name: true, countryCode: true },
    orderBy: { name: 'asc' }
  });
  const airportNamesDetailed = await prisma.city.findMany({
    where: { name: { contains: 'Airport', mode: 'insensitive' } },
    select: { slug: true, name: true, countryCode: true, profile: true },
    orderBy: { name: 'asc' }
  });
  console.log('TOTAL', total);
  console.log('AIRPORT_CITY_NAMES', airportNames.length);
  console.log('SAMPLE_AIRPORT_CITY_NAMES');
  for (const c of airportNamesDetailed.slice(0, 60)) {
    console.log(`${c.countryCode} | ${c.name} | ${c.slug}`);
  }
  await prisma.$disconnect();
})();
