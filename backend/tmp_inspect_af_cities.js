const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    await prisma.$connect();
    const cities = await prisma.city.findMany({ where: { countryCode: 'AF' } });
    console.log(JSON.stringify(cities, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
