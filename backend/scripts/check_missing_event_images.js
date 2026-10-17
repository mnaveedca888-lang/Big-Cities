const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.event.count();
  const missing = await prisma.event.count({ where: { image: null } });
  const africaMissing = await prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM "Event" e JOIN "Country" c ON c."code" = e."countryCode" JOIN "Continent" ct ON ct."id" = c."continentId" WHERE ct."name" = 'Africa' AND e."image" IS NULL;`;
  const sample = await prisma.event.findMany({
    where: { image: null },
    select: { id: true, title: true, countryCode: true, slug: true },
    take: 15,
    orderBy: { createdAt: 'asc' },
  });

  console.log(JSON.stringify({
    total,
    missing,
    africaMissing: Number(africaMissing[0]?.count ?? 0),
    sample,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
