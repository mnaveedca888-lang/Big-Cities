const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUnescoSitesTypo() {
  try {
    console.log('Fixing unicode_sites → unesco_sites typo...\n');

    const cities = await prisma.city.findMany({
      where: { countryCode: 'AZ' },
      select: { slug: true, name: true, profile: true }
    });

    for (const city of cities) {
      const profile = city.profile || {};
      
      // Check if unicode_sites exists and rename it
      if ('unicode_sites' in profile) {
        const unicodeSitesValue = profile.unicode_sites;
        delete profile.unicode_sites;
        profile.unesco_sites = unicodeSitesValue;

        await prisma.city.update({
          where: { slug: city.slug },
          data: { profile }
        });

        console.log(`✓ ${city.name}: Fixed unicode_sites → unesco_sites`);
      } else if ('unesco_sites' in profile) {
        console.log(`✓ ${city.name}: Already has correct field name`);
      } else {
        console.log(`✗ ${city.name}: Missing both unicode_sites and unesco_sites`);
      }
    }

    console.log('\n✅ Done!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUnescoSitesTypo();
