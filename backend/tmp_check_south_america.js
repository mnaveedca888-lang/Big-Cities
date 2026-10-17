const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const continent = await prisma.continent.findUnique({ where: { name: 'South America' }, include: { countries: true } });
    console.log('continent:', continent ? { id: continent.id, name: continent.name, countries: continent.countries.map((c) => c.code) } : null);
    const countries = await prisma.country.findMany({ where: { continent: { name: 'South America' } }, include: { _count: { select: { cities: true } } }, orderBy: { name: 'asc' } });
    console.log('countries:', countries.map((c) => ({ code: c.code, name: c.name, cities: c._count.cities })));
    const cityCount = await prisma.city.count({ where: { countryCode: { in: countries.map((c) => c.code) } } });
    console.log('totalCities:', cityCount);
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
