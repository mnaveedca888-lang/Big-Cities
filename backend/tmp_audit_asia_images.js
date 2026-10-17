const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const countries = await prisma.country.findMany({
      where: { continent: { name: 'Asia' } },
      select: { code: true, name: true },
    });

    const countryCodes = countries.map((country) => country.code);
    const totalEvents = await prisma.event.count({
      where: { countryCode: { in: countryCodes } },
    });
    const withImages = await prisma.event.count({
      where: { countryCode: { in: countryCodes }, image: { not: null } },
    });
    const nullImages = await prisma.event.count({
      where: { countryCode: { in: countryCodes }, image: null },
    });

    const all = await prisma.event.findMany({
      where: { countryCode: { in: countryCodes } },
      select: { id: true, title: true, countryCode: true, image: true },
      orderBy: [{ countryCode: 'asc' }, { title: 'asc' }],
    });

    console.log(JSON.stringify({
      countries: countries.length,
      countryCodes,
      totalEvents,
      withImages,
      nullImages,
      sample: all.slice(0, 10),
    }, null, 2));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
