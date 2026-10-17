require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const slugs = [
  'bi-burundi', 'fm-none', 'in-district-kutch', 'tr-mersin-adana-region',
  'au-christmas-island-airport', 'au-cocos-keeling-islands-airport', 'mh-marshall-islands-international-airport',
  'sc-seychelles-international-airport', 'nr-nauru-international-airport', 'mt-malta-international-airport', 'au-ayers-rock-airport',
  'mn-ulaanbaatar-sergelen-t-v-province',
];
async function main() {
  const output = [];
  for (const slug of slugs) {
    const city = await prisma.city.findUnique({ where: { slug } });
    if (!city) { output.push({ slug, missing: true }); continue; }
    const profile = city.profile && typeof city.profile === 'object' && !Array.isArray(city.profile) ? city.profile : {};
    output.push({ slug, name: city.name, countryCode: city.countryCode, eventCount: await prisma.event.count({ where: { citySlug: slug } }), profile: Object.fromEntries(['country','population','coordinates','shortDescription','overview','history','airport','sources','heroImageUrl'].map((key) => [key, profile[key] ?? null])) });
  }
  const mongolia = await prisma.city.findMany({ where: { countryCode: 'MN' }, select: { name: true, slug: true, countryCode: true } });
  console.log(JSON.stringify({ records: output, mongoliaCities: mongolia }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
