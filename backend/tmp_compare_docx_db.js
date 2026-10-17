const { PrismaClient } = require('@prisma/client');
const http = require('http');
const fs = require('fs');

const prisma = new PrismaClient();

// Read extracted DOCX data (from previous subagent)
let docxData = {};
try {
  const extractedFile = './AZERBAIJAN_CITIES_45_FIELDS_EXTRACTED.json';
  if (fs.existsSync(extractedFile)) {
    docxData = JSON.parse(fs.readFileSync(extractedFile, 'utf8'));
  }
} catch (e) {
  console.log('Could not read extracted DOCX data');
}

function makeAPIRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function compareData() {
  try {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║   DOCX → DATABASE → API SOURCE-TO-UI AUDIT                     ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const cityMap = {
      'Baku': 'az-baku',
      'Ganja': 'az-ganja',
      'Lankaran': 'az-lankaran',
      'Nakhchivan': 'az-nakhchivan',
      'Gabala': 'az-gabala',
      'Lachin': 'az-lachin',
      'Fuzuli': 'az-fuzuli',
      'Zangilan': 'az-zangilan',
      'Zaqatala': 'az-zaqatala'
    };

    // Key fields to check
    const fieldsToCheck = [
      'overview',
      'nickname',
      'history',
      'founded',
      'historical_significance',
      'area',
      'elevation',
      'rivers',
      'climate',
      'coordinates',
      'unicode_sites',
      'famous_landmarks',
      'museums',
      'traditional_food',
      'time_zone',
      'postal_code'
    ];

    const report = {};

    for (const [cityName, citySlug] of Object.entries(cityMap)) {
      console.log(`\n📍 ${cityName.toUpperCase()}`);
      console.log('─'.repeat(65));

      // Get from database
      const dbCity = await prisma.city.findUnique({
        where: { slug: citySlug },
        select: { name: true, profile: true }
      });

      if (!dbCity) {
        console.log('  ❌ NOT IN DATABASE');
        continue;
      }

      const profile = dbCity.profile || {};
      
      report[cityName] = {
        fields: {}
      };

      // Check each field
      for (const field of fieldsToCheck) {
        const docxValue = docxData.cities?.[cityName]?.[field];
        const dbValue = profile[field];
        
        let status = '';
        let docxStatus = docxValue ? '✓' : '✗';
        let dbStatus = dbValue ? '✓' : '✗';
        
        if (!docxValue && !dbValue) {
          status = '✓ BOTH EMPTY (OK)';
        } else if (docxValue && !dbValue) {
          status = '❌ DOCX HAS VALUE, DB EMPTY';
        } else if (!docxValue && dbValue) {
          status = '⚠️  DB HAS VALUE, DOCX EMPTY';
        } else if (docxValue && dbValue) {
          status = '✓ BOTH HAVE VALUES';
        }

        console.log(`  ${field.padEnd(25)} | DOCX: ${docxStatus} | DB: ${dbStatus} | ${status}`);

        report[cityName].fields[field] = {
          docx: docxValue ? '(present)' : null,
          database: dbValue ? '(present)' : null,
          status: status
        };
      }
    }

    // Save report
    fs.writeFileSync('DOCX_DATABASE_COMPARISON.json', JSON.stringify(report, null, 2));
    console.log('\n\n✅ Comparison saved to DOCX_DATABASE_COMPARISON.json');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

compareData();
