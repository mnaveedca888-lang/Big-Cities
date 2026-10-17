const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const historicalCategoryNames = ['Historical Commemoration','Memorial Day','National Holiday','Traditional Festival','Cultural Celebration'];
  const categories = await prisma.category.findMany({ where: { name: { in: historicalCategoryNames } }, select: { id: true, name: true } });
  const categoryIds = categories.map((c) => c.id);
  const countries = await prisma.country.findMany({ where: { continent: { name: 'Asia' } }, select: { code: true } });
  const countryCodes = countries.map((c) => c.code);
  const all = await prisma.event.findMany({
    where: { countryCode: { in: countryCodes }, categoryId: { in: categoryIds } },
    select: { id: true, title: true, countryCode: true, image: true, categoryId: true },
    orderBy: [{ countryCode: 'asc' }, { title: 'asc' }],
  });
  const nullImages = all.filter((e) => !e.image);
  console.log(JSON.stringify({
    historicalCategoryNames,
    categories: categories.map(c=>({id:c.id,name:c.name})),
    countryCodes: countryCodes.length,
    totalRows: all.length,
    nullRows: nullImages.length,
    sampleNulls: nullImages.slice(0, 20),
    first: all.slice(0, 5),
  }, null, 2));
  await prisma.$disconnect();
})();
