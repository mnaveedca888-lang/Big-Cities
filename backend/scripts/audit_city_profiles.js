require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function objectProfile(profile) {
  return profile && typeof profile === 'object' && !Array.isArray(profile) ? profile : {};
}

async function main() {
  const cities = await prisma.city.findMany({
    select: { slug: true, name: true, countryCode: true, profile: true },
    orderBy: [{ countryCode: 'asc' }, { name: 'asc' }],
  });
  const pakistanCities = cities.filter((city) => city.countryCode.trim().toUpperCase() === 'PK');
  const canonical = [...new Set(pakistanCities.flatMap((city) => Object.keys(objectProfile(city.profile))))].sort();
  const rows = cities.map((city) => {
    const profile = objectProfile(city.profile);
    const keys = Object.keys(profile);
    const missing = canonical.filter((key) => !Object.prototype.hasOwnProperty.call(profile, key));
    const extra = keys.filter((key) => !canonical.includes(key));
    const status = extra.length > 0 ? 'INVALID STRUCTURE' : missing.length > 0 ? 'MISSING FIELDS' : 'COMPLETE';
    return {
      slug: city.slug,
      name: city.name,
      countryCode: city.countryCode,
      present: canonical.filter((key) => Object.prototype.hasOwnProperty.call(profile, key)).length,
      missing: missing.length,
      extra: extra.length,
      missingFields: missing,
      extraFields: extra,
      status,
      profile,
    };
  });

  console.log('PAKISTAN_CITY_COUNT', pakistanCities.length);
  console.log('CANONICAL_CITY_FIELDS', canonical.length);
  console.log('CANONICAL_CITY_FIELD_NAMES', JSON.stringify(canonical));
  console.log('TOTAL_CITIES', cities.length);
  console.log('CITIES_AUDITED', rows.length);
  console.log('COMPLETE', rows.filter((row) => row.status === 'COMPLETE').length);
  console.log('MISSING_FIELDS', rows.filter((row) => row.status === 'MISSING FIELDS').length);
  console.log('INVALID_STRUCTURE', rows.filter((row) => row.status === 'INVALID STRUCTURE').length);
  console.log('COUNTRY_COUNTS', JSON.stringify(cities.reduce((counts, city) => {
    counts[city.countryCode] = (counts[city.countryCode] || 0) + 1;
    return counts;
  }, {})));
  for (const row of rows.filter((row) => row.countryCode !== 'PK').slice(0, 30)) {
    console.log(JSON.stringify({ ...row, profile: undefined }));
  }
}

main()
  .catch((error) => {
    console.error('CITY_AUDIT_FAILED');
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
