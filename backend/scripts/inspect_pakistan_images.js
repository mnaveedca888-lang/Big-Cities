const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const country = await prisma.country.findUnique({ where: { code: 'PK' } });
  console.log('COUNTRY_PK', JSON.stringify({ heroImageUrl: country?.profile?.heroImageUrl, flagImageUrl: country?.profile?.flagImageUrl }, null, 2));

  const cities = await prisma.city.findMany({
    where: { slug: { in: ['pk-islamabad', 'pk-karachi', 'pk-lahore', 'pk-multan', 'pk-faisalabad', 'pk-rawalpindi', 'pk-peshawar', 'pk-quetta'] } },
    orderBy: { slug: 'asc' },
  });

  for (const city of cities) {
    console.log(city.slug, JSON.stringify({ heroImageUrl: city.profile?.heroImageUrl }, null, 2));
  }

  await prisma.$disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
