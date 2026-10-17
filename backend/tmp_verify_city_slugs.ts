import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const cities = await prisma.city.findMany({
      where: { countryCode: 'PK' },
      select: { slug: true, name: true },
    });
    console.log(JSON.stringify(cities, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});