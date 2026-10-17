const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const updates = [
  ['pk-islamabad', 'City proper: 1.17M; metro: 2.24M (7th)'],
  ['pk-karachi', 'City proper: 17.92M; metro: 21.21M (1st)'],
  ['pk-lahore', 'City proper: 14.06M; metro: 15.24M (2nd)'],
  ['pk-multan', 'City proper: 2.15M; metro: 2.42M (6th)'],
  ['pk-peshawar', 'City proper: 2.51M; metro: 2.86M (5th)'],
  ['pk-quetta', 'City proper: 1.19M; metro: 1.41M (8th)'],
  ['pk-sialkot', 'City proper: 0.71M; metro: 1.02M (9th)'],
  ['pk-faisalabad', 'City proper: 3.75M; metro: 4.12M (3rd)'],
  ['pk-rawalpindi', 'City proper: 2.62M; metro: 4.10M (4th)'],
];

(async () => {
  for (const [slug, population] of updates) {
    const existing = await prisma.city.findUnique({ where: { slug }, select: { profile: true } });
    if (!existing) continue;

    const currentProfile = existing.profile && typeof existing.profile === 'object' ? existing.profile : {};
    await prisma.city.update({
      where: { slug },
      data: { profile: { ...currentProfile, population } },
    });
  }

  const updatedCities = await prisma.city.findMany({
    where: { countryCode: 'PK' },
    select: { slug: true, name: true, profile: true },
  });

  console.log(JSON.stringify(updatedCities, null, 2));
  await prisma.$disconnect();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
