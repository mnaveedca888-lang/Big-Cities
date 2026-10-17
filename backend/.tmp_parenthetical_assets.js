const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const folder = path.join(process.cwd(), 'public', 'Images', 'Asia cities images');
  const names = fs.readdirSync(folder).filter((name) => name.endsWith('.webp'));
  const slugs = names.map((name) => name.slice(0, -5));
  const cities = await prisma.city.findMany({ where: { slug: { in: slugs } }, select: { slug: true, name: true, countryCode: true } });
  console.log(JSON.stringify(cities.filter((city) => city.name.includes('(')), null, 2));
  await prisma.$disconnect();
})().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
