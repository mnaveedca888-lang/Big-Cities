const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const countries = await prisma.country.findMany({ where: { continent: { name: 'Asia' } }, select: { code: true } });
  const countryCodes = countries.map((c) => c.code);
  const rows = await prisma.event.findMany({
    where: { countryCode: { in: countryCodes }, image: null },
    select: { id: true, title: true, countryCode: true, description: true, categoryId: true, citySlug: true, startAt: true, endAt: true },
    orderBy: [{ countryCode: 'asc' }, { title: 'asc' }],
  });
  console.log(JSON.stringify(rows, null, 2));
  await prisma.$disconnect();
}
main();
