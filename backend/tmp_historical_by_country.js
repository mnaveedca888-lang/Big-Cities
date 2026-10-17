const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const historicalNames = ['Historical Commemoration','Memorial Day','National Holiday','Traditional Festival','Cultural Celebration'];
  const categories = await prisma.category.findMany({ where: { name: { in: historicalNames } }, select: { id: true, name: true } });
  const categoryIds = categories.map((c) => c.id);
  const countries = await prisma.country.findMany({ where: { continent: { name: 'Asia' } }, select: { code: true, name: true } });
  const countryCodes = countries.map((c) => c.code);
  const rows = await prisma.event.findMany({
    where: { countryCode: { in: countryCodes }, categoryId: { in: categoryIds } },
    select: { title: true, countryCode: true, image: true },
    orderBy: [{ countryCode: 'asc' }, { title: 'asc' }],
  });
  const summary = new Map();
  for (const row of rows) {
    const bucket = summary.get(row.countryCode) || { countryCode: row.countryCode, total: 0, valid: 0, missing: 0 };
    bucket.total += 1;
    if (row.image) bucket.valid += 1; else bucket.missing += 1;
    summary.set(row.countryCode, bucket);
  }
  const ordered = [...summary.values()].sort((a,b)=>a.countryCode.localeCompare(b.countryCode));
  console.log(JSON.stringify(ordered, null, 2));
  await prisma.$disconnect();
})();
