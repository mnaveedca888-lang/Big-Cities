const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cutoff = new Date(Date.now() - 1000 * 60 * 60); // last 1 hour
  const recent = await prisma.event.findMany({ where: { createdAt: { gt: cutoff } }, orderBy: { createdAt: 'desc' } });
  const nonIndia = recent.filter(e => e.countryCode !== 'IN');
  console.log('Recent events (last hour):', recent.length);
  console.log('Recent non-India events:', nonIndia.length);
  for (const e of nonIndia) console.log(e.slug, e.countryCode, e.createdAt.toISOString());
}

main().catch(e=>{console.error(e);process.exit(1)}).finally(async ()=>{await prisma.$disconnect()});
