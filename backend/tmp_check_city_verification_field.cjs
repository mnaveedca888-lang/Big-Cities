require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const total = await prisma.city.count();
  const rows = await prisma.city.findMany({ take: 2, orderBy: { slug: 'asc' }, select: { slug: true, name: true, isVerifiedCity: true } });
  console.log(JSON.stringify({ total, rows }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
