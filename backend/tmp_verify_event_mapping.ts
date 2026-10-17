import { PrismaClient } from '@prisma/client';
import { resolveImageUrlForTitle } from './src/events/event-image';

async function main() {
  const prisma = new PrismaClient();
  try {
    const events = await prisma.event.findMany({
      where: { countryCode: 'PK' },
      select: { slug: true, title: true },
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
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});