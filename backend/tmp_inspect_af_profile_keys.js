const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    await prisma.$connect();
    const cities = await prisma.city.findMany({ where: { countryCode: 'AF' }, select: { slug: true, name: true, profile: true } });
    for (const city of cities) {
      const keys = city.profile ? Object.keys(city.profile) : [];
      console.log(`${city.slug} | ${city.name} | keys=${keys.length} | ${JSON.stringify(keys)}`);
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
