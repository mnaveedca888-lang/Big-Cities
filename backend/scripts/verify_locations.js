require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const continents = await prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM "Continent"`;
  const countries = await prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM "Country"`;
  const cities = await prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM "City"`;
  const verifiedCities = await prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM "City" WHERE "isVerifiedCity" = TRUE`;
  const unverifiedCities = await prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM "City" WHERE "isVerifiedCity" = FALSE`;
  const nullContinent = await prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM "Country" WHERE "continentId" IS NULL`;
  const duplicateCodes = await prisma.$queryRaw`SELECT code, COUNT(*) as cnt FROM "Country" GROUP BY code HAVING COUNT(*)>1`;
  const duplicateNames = await prisma.$queryRaw`SELECT name, COUNT(*) as cnt FROM "Country" GROUP BY name HAVING COUNT(*)>1`;
  const sampleCities = await prisma.$queryRaw`SELECT "slug", "name", "countryCode" FROM "City" ORDER BY "countryCode" ASC, "name" ASC LIMIT 20`;
  const sampleCountries = await prisma.$queryRaw`SELECT "code", "name", "continentId" FROM "Country" ORDER BY "code" ASC LIMIT 20`;

  console.log('continents_count:', continents[0]?.count ?? 0);
  console.log('countries_count:', countries[0]?.count ?? 0);
  console.log('cities_count:', cities[0]?.count ?? 0);
  console.log('verified_city_count:', verifiedCities[0]?.count ?? 0);
  console.log('city_manual_review_count:', unverifiedCities[0]?.count ?? 0);
  console.log('null_continent_refs:', nullContinent[0]?.count ?? 0);
  console.log('duplicate_codes:', duplicateCodes);
  console.log('duplicate_names:', duplicateNames);
  console.log('sample_cities:', sampleCities);
  console.log('sample_countries:', sampleCountries);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
