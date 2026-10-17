const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const imageRoot = path.join(__dirname, 'public', 'Images');

function localForImageString(image) {
  if (!image || typeof image !== 'string') return null;
  const match = image.match(/^\/images\/(.+)$/);
  if (!match) return null;
  const relative = decodeURIComponent(match[1]).replace(/^Asia%20historical%20events\//, 'Asia historical events/');
  return path.join(imageRoot, relative.replace(/^Asia historical events\//, 'Asia historical events/'));
}

async function main() {
  const countries = await prisma.country.findMany({ where: { continent: { name: 'Asia' } }, select: { code: true } });
  const countryCodes = countries.map((c) => c.code);
  const events = await prisma.event.findMany({ where: { countryCode: { in: countryCodes } }, select: { id: true, title: true, countryCode: true, image: true } });
  let missing = [];
  let broken = [];
  let nonLocal = [];
  for (const e of events) {
    if (!e.image) continue;
    const local = localForImageString(e.image);
    if (!e.image.startsWith('/images/')) {
      nonLocal.push({ title: e.title, countryCode: e.countryCode, image: e.image });
      continue;
    }
    if (!local || !fs.existsSync(local)) {
      broken.push({ title: e.title, countryCode: e.countryCode, image: e.image, local });
    }
  }
  console.log(JSON.stringify({ total: events.length, withImage: events.filter((e) => e.image).length, brokenCount: broken.length, broken: broken.slice(0, 50), nonLocalCount: nonLocal.length, nonLocal: nonLocal.slice(0, 50) }, null, 2));
  await prisma.$disconnect();
}
main();
