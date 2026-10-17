import { PrismaClient } from '@prisma/client';
import { resolveImageUrlForTitle } from './src/events/event-image';
import { getPakistanCityImage } from './src/utils/pakistanImages';

async function main() {
  const prisma = new PrismaClient();
  try {
    const events = await prisma.event.findMany({
      where: { countryCode: 'PK' },
      select: { title: true, slug: true },
    });
    console.log(`Total PK events: ${events.length}`);
    let missing = 0;
    let other = 0;
    for (const ev of events) {
      const image = resolveImageUrlForTitle(ev.title);
      if (!image) {
        if (missing < 50) console.log('MISSING', ev.slug, ev.title);
        missing += 1;
      } else if (!image.includes('/images/Events%20in%20Pakistan/')) {
        if (other < 50) console.log('OTHER', ev.slug, ev.title, image);
        other += 1;
      }
    }
    console.log(`MISSING: ${missing}, OTHER: ${other}`);

    const cities = await prisma.city.findMany({
      where: { countryCode: 'PK' },
      select: { slug: true, name: true },
    });
    console.log(`Total PK cities: ${cities.length}`);
    let cityMissing = 0;
    for (const city of cities) {
      const image = getPakistanCityImage(city.slug);
      if (!image) {
        console.log('CITY_MISSING', city.slug, city.name);
        cityMissing += 1;
      }
    }
    console.log(`CITY_MISSING: ${cityMissing}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});