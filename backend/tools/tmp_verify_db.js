const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    const cityCountRaw = await prisma.$queryRaw`SELECT COUNT(*) AS count FROM "City"`;
    const cityCount = Number(cityCountRaw[0].count);
    const cities = await prisma.$queryRaw`SELECT "slug", "name", "countryCode" FROM "City" ORDER BY "name" ASC LIMIT 10`;
    const sampleCountries = await prisma.$queryRaw`SELECT "code", "name", "continentId" FROM "Country" ORDER BY "name" ASC LIMIT 10`;
    const countryCityCounts = await prisma.$queryRaw`SELECT c."code", c."name", COUNT(city.*)::int AS city_count FROM "Country" c LEFT JOIN "City" city ON city."countryCode" = c."code" GROUP BY c."code", c."name" ORDER BY c."name" ASC LIMIT 20`;
    const cityEventCounts = await prisma.$queryRaw`SELECT COALESCE("citySlug", 'NULL') AS city_slug, COUNT(*)::int AS event_count FROM "Event" GROUP BY "citySlug" ORDER BY event_count DESC LIMIT 20`;
    const countryEventCounts = await prisma.$queryRaw`SELECT COALESCE("countryCode", 'NULL') AS country_code, COUNT(*)::int AS event_count FROM "Event" GROUP BY "countryCode" ORDER BY event_count DESC LIMIT 20`;
    const distinctEventCountryCodes = await prisma.$queryRaw`SELECT DISTINCT "countryCode" FROM "Event" ORDER BY "countryCode" LIMIT 100`;
    const distinctEventCitySlugs = await prisma.$queryRaw`SELECT DISTINCT "citySlug" FROM "Event" ORDER BY "citySlug" LIMIT 100`;
    const sampleEvents = await prisma.$queryRaw`SELECT "id", "slug", "title", "countryCode", "citySlug" FROM "Event" ORDER BY "createdAt" DESC LIMIT 10`;
    console.log('CITY_COUNT', cityCount);
    console.log('SAMPLE_CITIES', JSON.stringify(cities, null, 2));
    console.log('SAMPLE_COUNTRIES', JSON.stringify(sampleCountries, null, 2));
    console.log('COUNTRY_CITY_COUNTS', JSON.stringify(countryCityCounts, null, 2));
    console.log('CITY_EVENT_COUNTS', JSON.stringify(cityEventCounts, null, 2));
    console.log('COUNTRY_EVENT_COUNTS', JSON.stringify(countryEventCounts, null, 2));
    console.log('SAMPLE_EVENTS', JSON.stringify(sampleEvents, null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
