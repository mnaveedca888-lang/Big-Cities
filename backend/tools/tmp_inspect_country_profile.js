const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const pk = await prisma.country.findUnique({ where: { code: 'PK' } });
  console.log('PK profile before update:');
  console.log(JSON.stringify(pk?.profile, null, 2));

  const matches = await prisma.country.findMany({
    where: { profile: { path: '$.population', equals: 'More than 240 million people' } },
    select: { code: true, name: true, profile: true },
  });

  console.log('Countries with old population value:');
  console.log(JSON.stringify(matches, null, 2));

  await prisma.$disconnect();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
