const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const continents = await prisma.continent.findMany({ include: { countries: true } });
  const results = [];
  for (const continent of continents) {
    const countries = continent.countries ?? [];
    const countryResults = [];
    for (const country of countries) {
      const cities = await prisma.city.findMany({ where: { countryCode: country.code }, orderBy: { slug: 'asc' }, select: { slug: true, name: true, countryCode: true } });
      const eligible = cities.filter((candidate) => /^[\p{L}][\p{L}\s.'’-]+$/u.test(candidate.name.trim()) && !/airport|airfield|terminal|sunport/i.test(`${candidate.name} ${candidate.slug}`));
      if (eligible.length) countryResults.push({ country: country.name, countryCode: country.code, city: eligible[0] });
    }
    results.push({ continent: continent.name, countriesWithNamedCities: countryResults.length, samples: countryResults.slice(0, 3) });
  }
  console.log(JSON.stringify(results, null, 2));
  await prisma.$disconnect();
})().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
