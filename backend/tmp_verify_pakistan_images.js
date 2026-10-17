const { PrismaClient } = require('@prisma/client');
const { resolveImageUrlForTitle } = require('./src/events/event-image');
const { getPakistanCityImage } = require('./src/utils/pakistanImages');

async function main() {
  const prisma = new PrismaClient();
  try {
    const events = await prisma.event.findMany({
      where: { countryCode: 'PK' },
      select: { slug: true, title: true },
    });
    console.log(`Total PK events: ${events.length}`);
    let missingEvents = 0;
    for (const ev of events) {
      const image = resolveImageUrlForTitle(ev.title);
      if (!image) {
        if (missingEvents < 50) console.log('MISSING_EVENT_IMAGE', ev.slug, ev.title);
        missingEvents += 1;
      }
    }
    console.log(`Total missing event images: ${missingEvents}`);

    const cities = await prisma.city.findMany({
      where: { countryCode: 'PK' },
      select: { slug: true, name: true },
    });
    console.log(`Total PK cities: ${cities.length}`);
    let missingCities = 0;
    for (const city of cities) {
      const image = getPakistanCityImage(city.slug);
      if (!image) {
        console.log('MISSING_CITY_IMAGE', city.slug, city.name);
        missingCities += 1;
      }
    }
    console.log(`Total missing city images: ${missingCities}`);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();