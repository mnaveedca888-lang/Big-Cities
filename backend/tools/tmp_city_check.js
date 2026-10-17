const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();
  const cities = await prisma.city.findMany({ where: { countryCode: 'PK' }, orderBy: { name: 'asc' } });
  console.log(JSON.stringify(cities, null, 2));
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
