const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const imagesDir = path.join(__dirname, 'public', 'Images', 'Asia historical events');

function cleanImagePath(value) {
  if (!value || typeof value !== 'string') return null;
  const url = value.split('?')[0];
  if (!url.startsWith('/images/')) return null;
  const relative = decodeURIComponent(url.replace(/^\/images\//, ''));
  const fullPath = path.join(__dirname, 'public', 'Images', relative.replace(/^Asia%20historical%20events\//, 'Asia historical events/'));
  return fullPath;
}

async function main() {
  const countries = await prisma.country.findMany({ where: { continent: { name: 'Asia' } }, select: { code: true } });
  const countryCodes = countries.map((c) => c.code);
  const rows = await prisma.event.findMany({ where: { countryCode: { in: countryCodes } }, select: { id: true, title: true, countryCode: true, image: true } });
  const broken = rows.filter((row) => row.image && row.image.startsWith('/images/') && !fs.existsSync(cleanImagePath(row.image)));
  console.log(JSON.stringify(broken.map((row) => ({ title: row.title, countryCode: row.countryCode, image: row.image })), null, 2));
  await prisma.$disconnect();
}
main();
