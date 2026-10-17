const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const country = await prisma.country.findUnique({ where: { code: 'IN' } });
    console.log('country', country ? 'FOUND' : 'MISSING');
    const cities = await prisma.city.findMany({ where: { countryCode: 'IN' }, select: { slug: true, name: true, profile: true } });
    console.log('cities count', cities.length);
    cities.forEach((c) => console.log(c.slug, c.name, Object.keys(c.profile || {}).length));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
