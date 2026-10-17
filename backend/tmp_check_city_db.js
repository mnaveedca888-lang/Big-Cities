const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCity() {
  try {
    const city = await prisma.city.findUnique({
      where: { slug: 'az-fuzuli' }
    });
    
    if (!city) {
      console.log('City not found in database');
    } else {
      console.log('City found:');
      console.log(`  Name: ${city.name}`);
      console.log(`  Slug: ${city.slug}`);
      console.log(`  Country: ${city.countryCode}`);
      console.log(`  Profile fields: ${Object.keys(city.profile || {}).length}`);
      console.log(`\n  Profile keys: ${Object.keys(city.profile || {}).join(', ')}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkCity();
