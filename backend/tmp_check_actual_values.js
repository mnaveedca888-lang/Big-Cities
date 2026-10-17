const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkActualData() {
  try {
    const cities = await prisma.city.findMany({
      where: { countryCode: 'AZ' },
      select: { name: true, slug: true, profile: true }
    });

    for (const city of cities) {
      const profile = city.profile || {};
      console.log(`\n${city.name}:`);
      console.log(`  movies_filmed: ${Array.isArray(profile.movies_filmed) ? JSON.stringify(profile.movies_filmed) : 'undefined'}`);
      console.log(`  tv_shows: ${Array.isArray(profile.tv_shows) ? JSON.stringify(profile.tv_shows) : 'undefined'}`);
      console.log(`  unesco_sites: ${Array.isArray(profile.unesco_sites) ? JSON.stringify(profile.unesco_sites) : 'undefined'}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkActualData();
