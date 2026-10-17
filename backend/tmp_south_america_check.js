const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const countryCodes = ['AR','BO','BR','CL','CO','EC','GY','PY','PE','SR','UY','VE'];
(async () => {
  try {
    const continent = await prisma.continent.findUnique({ where: { name: 'South America' }, include: { countries: true } });
    console.log('continent:', continent ? { id: continent.id, name: continent.name, countries: continent.countries.map((c) => c.code) } : null);
    const countries = await prisma.country.findMany({ where: { code: { in: countryCodes } }, select: { code: true, name: true, continentId: true } });
    console.log('countries:', countries);
    const cityCounts = await Promise.all(countryCodes.map(async (code) => ({ code, cities: await prisma.city.count({ where: { countryCode: code } }) })));
    console.log('cityCounts:', cityCounts);
    const eventCounts = await Promise.all(countryCodes.map(async (code) => ({ code, events: await prisma.event.count({ where: { countryCode: code } }) })));
    console.log('eventCounts:', eventCounts);
    const sampleEvents = await prisma.event.findMany({ where: { countryCode: { in: countryCodes } }, select: { slug: true, title: true, countryCode: true, citySlug: true }, orderBy: { countryCode: 'asc' }, take: 50 });
    console.log('sampleEvents:', sampleEvents);
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
