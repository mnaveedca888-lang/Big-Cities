const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const cities = await prisma.city.findMany({
      where: { countryCode: 'IN' },
      orderBy: { slug: 'asc' },
      select: { slug: true, name: true, profile: true },
    });
    console.log(JSON.stringify(cities, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
