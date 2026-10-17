import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
try {
  const country = await prisma.country.findUnique({ where: { code: 'IN' } });
  console.log(JSON.stringify(country, null, 2));
} catch (error) {
  console.error(error);
} finally {
  await prisma.$disconnect();
}
