require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
function normalize(value) { return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' '); }
async function main() {
  const cities = await prisma.city.findMany({ select: { slug: true, name: true, countryCode: true } });
  const groups = new Map();
  for (const city of cities) {
    const key = `${city.countryCode}|${normalize(city.name)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(city);
  }
  const duplicates = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const records = [];
    for (const city of group) {
      const eventCount = await prisma.event.count({ where: { citySlug: city.slug } });
      records.push({ ...city, eventCount });
    }
    duplicates.push({ countryCode: group[0].countryCode, normalizedName: normalize(group[0].name), records });
  }
  console.log(JSON.stringify({ cityCount: cities.length, duplicateGroups: duplicates.length, duplicates }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
