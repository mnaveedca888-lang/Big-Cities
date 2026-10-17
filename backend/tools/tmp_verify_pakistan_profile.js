const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const pk = await prisma.country.findUnique({
      where: { code: 'PK' },
      select: { code: true, name: true, profile: true }
    });

    const matches = await prisma.country.findMany({
      where: {
        profile: {
          path: ['population'],
          equals: '259.5 million (latest estimate)'
        }
      },
      select: { code: true, name: true }
    });

    console.log(JSON.stringify({
      pk: {
        code: pk?.code,
        name: pk?.name,
        population: pk?.profile?.population,
        capital: pk?.profile?.capital
      },
      matches
    }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
