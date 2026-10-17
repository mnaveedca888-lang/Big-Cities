require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const response = await fetch('http://localhost:4001/cities');
  if (!response.ok) throw new Error(`GET /cities returned HTTP ${response.status}: ${await response.text()}`);
  const body = await response.json();
  const apiCities = body.data;
  const dbCities = await prisma.city.findMany({ where: { isVerifiedCity: true }, select: { slug: true, name: true } });
  const apiSlugs = new Set(apiCities.map((city) => city.slug));
  const missingApi = dbCities.filter((city) => !apiSlugs.has(city.slug));
  const leakedAnr = apiCities.filter((city) => /a\.?\s*n\.?\s*r\.?\s*robinson/i.test(city.name));
  const manualSlugs = await prisma.city.findMany({ where: { isVerifiedCity: false }, select: { slug: true } });
  const leakedManualReview = manualSlugs.filter((city) => apiSlugs.has(city.slug));
  if (apiCities.length !== dbCities.length || missingApi.length || leakedAnr.length || leakedManualReview.length) {
    throw new Error(JSON.stringify({ apiCount: apiCities.length, verifiedDbCount: dbCities.length, missingApi: missingApi.slice(0, 10), leakedAnr, leakedManualReview: leakedManualReview.slice(0, 10) }));
  }
  console.log(JSON.stringify({ httpStatus: response.status, apiCityCount: apiCities.length, verifiedDbCount: dbCities.length, manualReviewCount: manualSlugs.length, aNRRobinsonInApi: false, leakedManualReviewCount: leakedManualReview.length }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
