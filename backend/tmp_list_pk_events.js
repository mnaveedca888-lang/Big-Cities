const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const events = await prisma.event.findMany({ where: { countryCode: 'PK' }, select: { slug: true, title: true } });
    console.log(`Total events: ${events.length}`);
    for (const event of events) {
      console.log(`${event.slug}|||${event.title}`);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
})();
