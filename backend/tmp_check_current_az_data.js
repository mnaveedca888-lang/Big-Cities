const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const cities = await prisma.city.findMany({
      where: { countryCode: 'AZ' },
      orderBy: { name: 'asc' }
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('CURRENT AZERBAIJAN CITY DATABASE STATE');
    console.log('═══════════════════════════════════════════════════════════════\n');

    for (const city of cities) {
      console.log(`\n📍 CITY: ${city.name.toUpperCase()} (${city.slug})`);
      console.log('─'.repeat(60));
      
      if (!city.profile) {
        console.log('   ⚠️  No profile data');
        continue;
      }

      const profile = city.profile;
      const fields = Object.keys(profile).sort();
      
      console.log(`   Total fields in profile: ${fields.length}`);
      console.log(`\n   Fields present:`);
      for (const field of fields) {
        const value = profile[field];
        if (value !== null && value !== undefined && value !== '') {
          const displayValue = JSON.stringify(value).substring(0, 50);
          console.log(`   ✓ ${field}: ${displayValue}`);
        } else {
          console.log(`   ✗ ${field}: [EMPTY]`);
        }
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('SUMMARY: Current database field coverage');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    for (const city of cities) {
      const fieldCount = city.profile ? Object.keys(city.profile).length : 0;
      const populatedFields = city.profile ? 
        Object.keys(city.profile).filter(k => city.profile[k] !== null && city.profile[k] !== undefined && city.profile[k] !== '').length 
        : 0;
      console.log(`${city.name.padEnd(15)} - ${fieldCount} fields, ${populatedFields} populated`);
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
