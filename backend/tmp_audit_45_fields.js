const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const REQUIRED_FIELDS = [
  "population",           // 1,43
  "nickname",             // 2
  "shortDescription",     // 3
  "history",              // 4
  "founded",              // 5
  "historical_significance", // 6
  "area",                 // 7
  "elevation",            // 8
  "rivers",               // 9
  "climate",              // 10
  "coordinates",          // 11
  "unesco_sites",         // 12
  "major_landmarks",      // 13
  "museums",              // 14
  "parks",                // 15
  "traditional_food",     // 16
  "street_food",          // 17
  "popular_restaurants",  // 18
  "festivals",            // 19
  "cultural_events",      // 20
  "arts",                 // 21
  "music",                // 22
  "major_industries",     // 23
  "technology",           // 24
  "tourism",              // 25
  "manufacturing",        // 26
  "finance",              // 27
  "metro",                // 28
  "airport",              // 29
  "railway",              // 30
  "bus_network",          // 31
  "major_roads",          // 32
  "movies_filmed",        // 33
  "tv_shows",             // 34
  "sports",               // 35
  "stadiums",             // 36
  "famous_people",        // 37
  "world_records",        // 38
  "interesting_facts",    // 39
  "unique_customs",       // 40
  "unique_transportation",// 41
  "surprising_facts",     // 42
  "time_zone",            // 44
  "postal_code"           // 45
];

const FIELD_LABELS = [
  "1. City Population",
  "2. Nickname",
  "3. Overview",
  "4. History",
  "5. Founded",
  "6. Historical Significance",
  "7. Area",
  "8. Elevation",
  "9. Rivers",
  "10. Climate",
  "11. Coordinates",
  "12. UNESCO Sites",
  "13. Famous Landmarks",
  "14. Museums",
  "15. Parks",
  "16. Traditional Food",
  "17. Street Food",
  "18. Popular Restaurants",
  "19. Festivals",
  "20. Cultural Events",
  "21. Arts",
  "22. Music",
  "23. Major Industries",
  "24. Technology",
  "25. Tourism",
  "26. Manufacturing",
  "27. Finance",
  "28. Metro",
  "29. Airport",
  "30. Railway",
  "31. Bus Network",
  "32. Major Roads",
  "33. Movies Filmed Here",
  "34. TV Shows",
  "35. Sports",
  "36. Stadiums",
  "37. Famous People",
  "38. World Records",
  "39. Interesting Facts",
  "40. Unique Customs",
  "41. Unique Transportation",
  "42. Surprising Facts",
  "44. Time Zone",
  "45. Postal Code"
];

function hasValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  // Empty arrays are VALID populated fields (means "none of this item type")
  // Only return false if undefined or null
  if (Array.isArray(value)) return true; // Even empty arrays = populated
  if (typeof value === 'object' && Object.keys(value).length === 0) return false;
  return true;
}

async function auditCity(citySlug) {
  const city = await prisma.city.findUnique({ where: { slug: citySlug } });
  
  if (!city) {
    return null;
  }

  const profile = city.profile || {};
  const implemented = [];
  const missing = [];

  for (let i = 0; i < REQUIRED_FIELDS.length; i++) {
    const field = REQUIRED_FIELDS[i];
    const label = FIELD_LABELS[i];
    
    const value = profile[field];
    if (hasValue(value)) {
      implemented.push({ field, label, value });
    } else {
      missing.push({ field, label });
    }
  }

  return {
    name: city.name,
    slug: city.slug,
    total_required: REQUIRED_FIELDS.length,
    implemented: implemented.length,
    missing: missing.length,
    implemented_fields: implemented,
    missing_fields: missing
  };
}

async function main() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║         45-FIELD COMPLETENESS AUDIT FOR AZERBAIJAN CITIES       ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const cityOrder = ['az-baku', 'az-ganja', 'az-lankaran', 'az-nakhchivan', 
                       'az-gabala', 'az-lachin', 'az-fuzuli', 'az-zangilan', 'az-zaqatala'];

    const allResults = [];

    for (const citySlug of cityOrder) {
      const result = await auditCity(citySlug);
      if (!result) continue;

      allResults.push(result);

      console.log(`\n📍 ${result.name.toUpperCase()} (${result.slug})`);
      console.log('─'.repeat(65));
      console.log(`   Required Fields: ${result.total_required}`);
      console.log(`   ✓ Implemented: ${result.implemented}`);
      console.log(`   ✗ Missing: ${result.missing}`);
      console.log(`   Coverage: ${Math.round((result.implemented / result.total_required) * 100)}%`);

      if (result.missing_fields.length > 0 && result.missing_fields.length <= 10) {
        console.log(`\n   Missing Fields:`);
        for (const field of result.missing_fields) {
          console.log(`   ✗ ${field.label}`);
        }
      } else if (result.missing_fields.length > 10) {
        console.log(`\n   Top 10 Missing Fields:`);
        for (const field of result.missing_fields.slice(0, 10)) {
          console.log(`   ✗ ${field.label}`);
        }
        console.log(`   ... and ${result.missing_fields.length - 10} more`);
      }
    }

    // Summary
    console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                        SUMMARY BY CITY                           ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    for (const result of allResults) {
      const coverage = Math.round((result.implemented / result.total_required) * 100);
      const bar = '█'.repeat(Math.round(coverage / 5)) + '░'.repeat(20 - Math.round(coverage / 5));
      console.log(`${result.name.padEnd(15)} [${bar}] ${result.implemented}/${result.total_required} (${coverage}%)`);
    }

    // Overall stats
    const totalRequired = allResults.reduce((sum, r) => sum + r.total_required, 0);
    const totalImplemented = allResults.reduce((sum, r) => sum + r.implemented, 0);
    const totalMissing = allResults.reduce((sum, r) => sum + r.missing, 0);
    const overallCoverage = Math.round((totalImplemented / totalRequired) * 100);

    console.log('\n' + '═'.repeat(65));
    console.log(`OVERALL: ${totalImplemented}/${totalRequired} fields implemented (${overallCoverage}% coverage)`);
    console.log(`Missing fields across all cities: ${totalMissing}`);
    console.log('═'.repeat(65) + '\n');

    console.log('\nDetailed missing fields by city:\n');
    for (const result of allResults) {
      if (result.missing_fields.length > 0) {
        console.log(`\n${result.name}:`);
        for (const field of result.missing_fields) {
          console.log(`  ✗ ${field.label} (${field.field})`);
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
