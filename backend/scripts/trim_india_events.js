const { PrismaClient } = require('@prisma/client');
const { events, slugify } = require('./seed_india_events');

const prisma = new PrismaClient();

async function main() {
  const desiredSlugs = new Set(events.map(e => slugify(`${e.countryCode}-${e.citySlug || 'all'}-${e.title}`)));

  const indiaEvents = await prisma.event.findMany({ where: { countryCode: 'IN' } });
  const toDelete = indiaEvents.filter(ev => !desiredSlugs.has(ev.slug));

  console.log(`Found ${indiaEvents.length} India events, will delete ${toDelete.length} not in desired set.`);

  for (const ev of toDelete) {
    try {
      await prisma.event.delete({ where: { id: ev.id } });
      console.log('Deleted', ev.slug);
    } catch (err) {
      console.error('Failed to delete', ev.slug, err.message);
    }
  }

  const finalCount = await prisma.event.count({ where: { countryCode: 'IN' } });
  console.log('Final India event count:', finalCount);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
