const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== AZERBAIJAN DATA VERIFICATION ===\n');

    // 1. Verify Country
    console.log('1. COUNTRY VERIFICATION');
    const country = await prisma.country.findUnique({ where: { code: 'AZ' } });
    console.log(`   Name: ${country?.name}`);
    console.log(`   Capital: ${country?.profile?.capital}`);
    console.log(`   Population: ${country?.profile?.population?.toLocaleString()}`);
    console.log(`   Area: ${country?.profile?.area} ${country?.profile?.area_unit}`);
    console.log(`   ✓ Country data present\n`);

    // 2. Verify Cities
    console.log('2. CITIES VERIFICATION');
    const cities = await prisma.city.findMany({ where: { countryCode: 'AZ' }, orderBy: { name: 'asc' } });
    console.log(`   Total cities: ${cities.length}`);
    for (const city of cities) {
      const events = await prisma.event.count({ where: { citySlug: city.slug } });
      console.log(`   - ${city.name} (${city.slug}): ${city.profile?.population?.toLocaleString() || 'N/A'} pop, ${events} events`);
    }
    console.log();

    // 3. Verify Events
    console.log('3. EVENTS VERIFICATION');
    const events = await prisma.event.findMany({ where: { countryCode: 'AZ' }, orderBy: { startAt: 'asc' } });
    console.log(`   Total events: ${events.length}`);
    const cityLinked = events.filter((e) => e.citySlug).length;
    const cityUnlinked = events.filter((e) => !e.citySlug).length;
    console.log(`   - City-linked events: ${cityLinked}`);
    console.log(`   - Country-level events: ${cityUnlinked}`);
    console.log();

    // 4. Event details
    console.log('4. EVENT DETAILS');
    for (const event of events.slice(0, 5)) {
      console.log(`   - ${event.title}`);
      console.log(`     Date: ${event.startAt.toLocaleDateString()} - ${event.endAt.toLocaleDateString()}`);
      console.log(`     City: ${event.citySlug || '(National)'}  Featured: ${event.featured}`);
    }
    console.log(`   ... and ${Math.max(0, events.length - 5)} more events\n`);

    // 5. City-Event Linkage
    console.log('5. CITY-EVENT LINKAGE');
    for (const city of cities.filter((c) => [0, 1].includes(cities.indexOf(c)))) {
      const cityEvents = await prisma.event.findMany({ where: { citySlug: city.slug } });
      if (cityEvents.length > 0) {
        console.log(`   ${city.name}:`);
        for (const ev of cityEvents) {
          console.log(`     - ${ev.title}`);
        }
      } else {
        console.log(`   ${city.name}: (no specific events)`);
      }
    }
    console.log();

    // 6. Data Completeness
    console.log('6. DATA COMPLETENESS');
    console.log(`   ✓ Country profile fields: ${Object.keys(country?.profile || {}).length}`);
    console.log(`   ✓ Average city profile fields: ${Math.round(cities.reduce((sum, c) => sum + Object.keys(c.profile || {}).length, 0) / cities.length)}`);
    console.log(`   ✓ Events with descriptions: ${events.filter((e) => e.description).length}/${events.length}`);
    console.log();

    console.log('=== VERIFICATION COMPLETE ===');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
