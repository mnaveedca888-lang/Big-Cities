const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const slugs = ['af-kabul','af-kandahar','af-herat','af-mazar-i-sharif','af-khost'];
    for (const slug of slugs) {
      const city = await prisma.city.findUnique({ where: { slug }, select: { slug: true, name: true, countryCode: true, profile: true } });
      console.log('CITY', slug, city ? 'FOUND' : 'MISSING');
      if (city) {
        console.log(JSON.stringify(city.profile, null, 2));
      }
      const events = await prisma.event.findMany({ where: { citySlug: slug }, select: { slug: true, title: true, countryCode: true, citySlug: true } });
      console.log('EVENTS', slug, events.length, events.map((e) => e.slug));
      console.log('---');
    }
  } catch (error) {
    console.error('ERROR', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
