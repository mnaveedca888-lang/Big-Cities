const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  await prisma.$connect();
  try {
    const afCities = await prisma.city.findMany({
      where: { countryCode: 'AF' },
      orderBy: { name: 'asc' },
    });
    console.log('TOTAL_AF_CITIES', afCities.length);
    afCities.forEach((city) => {
      console.log('CITY', city.slug, city.name, city.countryCode, 'image=', city.image || null, 'heroImageUrl=', city.heroImageUrl || null, 'profileKeys=', city.profile ? Object.keys(city.profile).join(',') : 'none');
    });

    const authCities = await prisma.city.findMany({ where: { name: { contains: 'AUTH TEST' } } });
    console.log('AUTH_CITY_MATCHES', authCities.length);
    authCities.forEach((city) => console.log('AUTH_CITY', city.slug, city.name, city.countryCode, 'image=', city.image || null, 'heroImageUrl=', city.heroImageUrl || null));

    const authEvents = await prisma.event.findMany({ where: { title: { contains: 'AUTH TEST' } } });
    console.log('AUTH_EVENT_MATCHES', authEvents.length);
    authEvents.forEach((event) => console.log('AUTH_EVENT', event.slug, event.title, event.countryCode, event.citySlug, 'published=', event.published));

    const afKabul = await prisma.city.findUnique({ where: { slug: 'af-kabul' } });
    const afKandahar = await prisma.city.findUnique({ where: { slug: 'af-kandahar' } });
    console.log('KABUL', JSON.stringify(afKabul, null, 2));
    console.log('KANDAHAR', JSON.stringify(afKandahar, null, 2));
  } catch (err) {
    console.error('ERROR', err);
  } finally {
    await prisma.$disconnect();
  }
})();