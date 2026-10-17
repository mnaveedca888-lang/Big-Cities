const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const cities = await prisma.city.findMany({ where: { slug: { in: ['id-lombok-praya', 'id-tangerang-jakarta', 'my-sepang-kuala-lumpur'] } }, select: { slug: true, name: true, countryCode: true } });
  console.log(JSON.stringify(cities, null, 2));
  await prisma.$disconnect();
})().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
