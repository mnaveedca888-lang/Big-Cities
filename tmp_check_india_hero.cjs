const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const country = await prisma.country.findUnique({ where: { code: 'IN' } });
    console.log(JSON.stringify(country, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
})();
