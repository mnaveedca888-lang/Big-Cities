require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const slugs = [
  'tt-a-n-r-robinson-international-airport',
  'gb-george-best-belfast-city-airport', 'gb-belfast-international-airport',
  'us-orlando-sanford-international-airport', 'us-orlando-international-airport',
  'gb-london-gatwick-airport', 'gb-london-heathrow-airport',
  'se-stockholm-arlanda-airport', 'se-stockholm-bromma-airport',
  'ao-dr-ant-nio-agostinho-neto-international-airport-nbj-luanda', 'ao-quatro-de-fevereiro-international-airport-lad-luanda',
  'cy-larnaca-international-airport', 'cy-larnaca', 'cy-paphos-international-airport', 'cy-paphos',
  'id-yogyakarta-limited-international-operations', 'id-yogyakarta',
];
async function main() {
  const rows = [];
  for (const slug of slugs) {
    const city = await prisma.city.findUnique({ where: { slug } });
    if (!city) { rows.push({ slug, missing: true }); continue; }
    const eventCount = await prisma.event.count({ where: { citySlug: slug } });
    const profile = city.profile && typeof city.profile === 'object' && !Array.isArray(city.profile) ? city.profile : {};
    rows.push({ slug, name: city.name, countryCode: city.countryCode, eventCount, heroImageUrl: profile.heroImageUrl || null, thumbnail: profile.thumbnail || null });
  }
  console.log(JSON.stringify(rows, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
