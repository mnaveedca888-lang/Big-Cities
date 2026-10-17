const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const countries = await prisma.country.findMany({
    where: { continent: { name: 'Asia' } },
    select: { code: true },
  });
  const countryCodes = countries.map((country) => country.code);
  const rows = await prisma.event.findMany({
    where: { countryCode: { in: countryCodes }, image: null },
    select: { id: true, title: true, countryCode: true, categoryId: true },
    orderBy: [{ countryCode: 'asc' }, { title: 'asc' }],
  });
  const categoryIds = rows.map((row) => row.categoryId).filter(Boolean);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  });
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));
  console.log(JSON.stringify(rows.map((row) => ({
    id: row.id,
    title: row.title,
    countryCode: row.countryCode,
    category: categoryMap.get(row.categoryId) || 'unknown',
  })), null, 2));
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
