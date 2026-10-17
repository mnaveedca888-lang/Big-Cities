const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAzerbaijan() {
  try {
    const country = await prisma.country.findUnique({
      where: { code: 'AZ' }
    });
    
    if (!country) {
      console.log('❌ Azerbaijan country not found in database');
    } else {
      console.log('✅ Azerbaijan country found:');
      console.log(JSON.stringify(country, null, 2));
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkAzerbaijan();
