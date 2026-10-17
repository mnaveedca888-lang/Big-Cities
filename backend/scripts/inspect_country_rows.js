const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const countries = await prisma.country.findMany({
    where: { code: { in: ['PK', 'US', 'GB', 'FR', 'DE', 'JP'] } },
    select: { code: true, name: true, profile: true },
  });
  console.log('COUNTRIES');
  console.log(JSON.stringify(countries, null, 2));

  const cities = await prisma.city.findMany({
    where: { countryCode: { in: ['PK', 'US', 'GB', 'FR', 'DE', 'JP'] } },
    select: { slug: true, name: true, countryCode: true, profile: true },
  });
  console.log('CITIES');
  console.log(JSON.stringify(cities, null, 2));

  await prisma.$disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
