const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    const countries = await prisma.country.findMany({ where: { code: 'AF' } });
    const cities = await prisma.city.findMany({ where: { countryCode: 'AF' } });
    const events = await prisma.event.findMany({ where: { countryCode: 'AF' } });
    console.log('countries:', countries.length);
    console.log('cities:', cities.length);
    console.log('events:', events.length);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
