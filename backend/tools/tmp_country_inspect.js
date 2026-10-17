const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  await prisma.$connect();
  try {
    const totals = await prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM "Country"`;
    const notIso = await prisma.$queryRaw`SELECT "code","name" FROM "Country" WHERE LENGTH("code") != 2 ORDER BY "code" LIMIT 100`;
    const duplicates = await prisma.$queryRaw`SELECT "code",COUNT(*)::int AS cnt FROM "Country" GROUP BY "code" HAVING COUNT(*) > 1 ORDER BY cnt DESC`;
    const sampleUs = await prisma.$queryRaw`SELECT "slug","name","countryCode" FROM "City" WHERE "countryCode"='US' ORDER BY "name" LIMIT 20`;
    const eventCount = await prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM "Event"`;
    console.log(JSON.stringify({ totals: totals[0].count, notIso, duplicates, sampleUs, eventCount: eventCount[0].count }, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
})();
