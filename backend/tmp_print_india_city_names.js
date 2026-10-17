const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const cities = await prisma.city.findMany({
      where: { countryCode: 'IN' },
      orderBy: { slug: 'asc' },
      select: { slug: true, name: true },
    });
    for (const city of cities) {
      console.log(`${city.slug}|${city.name}`);
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
