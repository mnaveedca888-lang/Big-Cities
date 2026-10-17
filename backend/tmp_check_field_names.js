const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFuzuli() {
  try {
    console.log('Checking Fuzuli in database...\n');
    
    const fuzuli = await prisma.city.findUnique({
      where: { slug: 'az-fuzuli' }
    });

    if (!fuzuli) {
      console.log('Fuzuli not found in database');
      return;
    }

    console.log('Database profile keys for Fuzuli:');
    const profile = fuzuli.profile || {};
    const keys = Object.keys(profile).sort();
    
    for (const key of keys) {
      const value = profile[key];
      let displayValue = '';
      if (Array.isArray(value)) {
        displayValue = `[${value.length} items]: ${value.slice(0, 2).join(', ')}${value.length > 2 ? '...' : ''}`;
      } else if (typeof value === 'object') {
        displayValue = JSON.stringify(value).substring(0, 60);
      } else if (typeof value === 'string') {
        displayValue = value.substring(0, 80);
      } else {
        displayValue = String(value);
      }
      
      console.log(`  "${key}": ${displayValue}`);
    }

    console.log('\n\nField name mismatches (Database vs Frontend expected):');
    console.log('Database uses snake_case, Frontend expects camelCase:\n');
    
    const mismatchMap = {
      'unicode_sites': 'unescoSites',
      'major_landmarks': 'famousLandmarks',
      'traditional_food': 'traditionalFood',
      'street_food': 'streetFood',
      'popular_restaurants': 'popularRestaurants',
      'cultural_events': 'culturalEvents',
      'major_industries': 'majorIndustries',
      'bus_network': 'busNetwork',
      'major_roads': 'majorRoads',
      'movies_filmed': 'moviesFilmedHere',
      'tv_shows': 'tvShows',
      'famous_people': 'famousPeople',
      'world_records': 'worldRecords',
      'interesting_facts': 'interestingFacts',
      'unique_customs': 'uniqueCustoms',
      'unique_transportation': 'uniqueTransportation',
      'surprising_facts': 'surprisingFacts',
      'time_zone': 'timeZone',
      'postal_code': 'postalCode',
      'historical_significance': 'historicalSignificance'
    };

    for (const [dbName, frontendName] of Object.entries(mismatchMap)) {
      const hasInDb = dbName in profile;
      console.log(`  ${hasInDb ? '✓' : '✗'} DB: "${dbName}" → Frontend: "${frontendName}"`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFuzuli();
