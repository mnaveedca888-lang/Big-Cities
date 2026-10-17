const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const countries = await prisma.country.findMany({ where: { continent: { name: 'South America' } }, orderBy: { code: 'asc' } });
    for (const country of countries) {
      const cities = await prisma.city.findMany({ where: { countryCode: country.code }, orderBy: { slug: 'asc' } });
      console.log(`\n=== ${country.code} ${country.name} (${cities.length}) ===`);
      for (const city of cities) {
        console.log(JSON.stringify({ slug: city.slug, name: city.name, countryCode: city.countryCode }));
      }
    }
    const total = await prisma.city.count({ where: { countryCode: { in: countries.map((c) => c.code) } } });
    console.log(`\nTOTAL CITIES: ${total}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
