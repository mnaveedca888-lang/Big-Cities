const { PrismaClient } = require('@prisma/client');

(async function(){
  const prisma = new PrismaClient();
  try {
    const events = await prisma.event.findMany({ where: { countryCode: 'IN' }, select: { id: true, slug: true, title: true, startAt: true } });
    console.log('COUNT:' + events.length);
    console.log(JSON.stringify(events, null, 2));
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
