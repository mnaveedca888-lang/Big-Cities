const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const countries = await prisma.country.findMany({
    where: { continent: { name: 'Africa' } },
    select: { code: true },
  });
  const codes = countries.map((c) => c.code);
  const cities = await prisma.city.findMany({
    where: { countryCode: { in: codes } },
    select: { slug: true, name: true, countryCode: true, profile: true },
    orderBy: [{ countryCode: 'asc' }, { slug: 'asc' }],
  });

  const missing = cities.filter((c) => {
    const profile = c.profile && typeof c.profile === 'object' && !Array.isArray(c.profile) ? c.profile : {};
    const hero = profile.heroImageUrl;
    return !hero || !String(hero).trim();
  });

  console.log(JSON.stringify({
    missingImageRows: missing.length,
    rows: missing.map((c) => ({
      countryCode: c.countryCode,
      name: c.name,
      slug: c.slug,
      heroImageUrl: c.profile && typeof c.profile === 'object' && !Array.isArray(c.profile) ? c.profile.heroImageUrl || null : null,
    })),
  }, null, 2));

  await prisma.$disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
