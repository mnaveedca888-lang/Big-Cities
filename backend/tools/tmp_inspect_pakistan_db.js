const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const cities = await prisma.city.findMany({
    where: { countryCode: 'PK' },
    select: { slug: true, name: true, profile: true }
  });
  console.log(JSON.stringify(cities, null, 2));
  await prisma.$disconnect();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
