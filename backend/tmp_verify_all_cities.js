const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
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
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

const cities = [
  'az-baku',
  'az-ganja',
  'az-lankaran',
  'az-nakhchivan',
  'az-gabala',
  'az-lachin',
  'az-fuzuli',
  'az-zangilan',
  'az-zaqatala'
];

const camelCaseFields = [
  'overview', 'nickname', 'history', 'population', 'founded',
  'area', 'elevation', 'rivers', 'climate', 'coordinates',
  'timeZone', 'postalCode', 'airports', 'railway', 'busNetwork',
  'majorRoads', 'majorLandmarks', 'museums', 'parks', 'festivals',
  'culturalEvents', 'arts', 'music', 'sports', 'stadiums',
  'traditionalFood', 'streetFood', 'popularRestaurants',
  'famousPeople', 'interestingFacts', 'uniqueCustoms', 'worldRecords',
  'moviesFilmed', 'tvShows', 'technology', 'manufacturing',
  'majorIndustries', 'tourism', 'finance', 'metro', 'airport',
  'surprisingFacts', 'uniqueTransportation', 'historicalSignificance',
  'unescoSites'
];

async function verifyAllCities() {
  console.log('🔍 Verifying API field conversion for all Azerbaijan cities\n');
  
  for (const citySlug of cities) {
    try {
      const response = await makeRequest(`/cities/${citySlug}`);
      const { data } = response;
      
      if (!data) {
        console.log(`❌ ${citySlug}: No data returned`);
        continue;
      }
      
      const profile = data.profile || {};
      const profileKeys = Object.keys(profile);
      
      // Check for snake_case (bad)
      const snakeCaseKeys = profileKeys.filter(k => k.includes('_'));
      
      // Count how many fields have values (not empty/null)
      const fieldsWithValues = profileKeys.filter(k => {
        const val = profile[k];
        return val !== null && val !== '' && val !== undefined;
      });
      
      let statusIcon = '✅';
      if (snakeCaseKeys.length > 0) {
        statusIcon = '❌';
      }
      
      console.log(`${statusIcon} ${citySlug.toUpperCase()}:`);
      console.log(`   Profile fields: ${profileKeys.length}`);
      console.log(`   Fields with values: ${fieldsWithValues.length}`);
      
      if (snakeCaseKeys.length > 0) {
        console.log(`   ⚠️  Found ${snakeCaseKeys.length} snake_case keys: ${snakeCaseKeys.join(', ')}`);
      }
      
      // Sample a few fields
      const sampleFields = ['nickname', 'history', 'timeZone', 'coordinates', 'majorLandmarks'];
      const missingFields = sampleFields.filter(f => !profileKeys.includes(f));
      
      if (missingFields.length > 0) {
        console.log(`   ⚠️  Missing expected fields: ${missingFields.join(', ')}`);
      }
      
      console.log();
      
    } catch (error) {
      console.log(`❌ ${citySlug}: Error - ${error.message}\n`);
    }
  }
}

async function verifyFuzuliDetail() {
  console.log('\n🔍 Detailed Fuzuli city verification:\n');
  
  try {
    const response = await makeRequest('/cities/az-fuzuli');
    const { data } = response;
    const profile = data.profile || {};
    
    const testFields = {
      'nickname': 'Should show city nickname',
      'timeZone': 'Should show AZT (UTC+4)',
      'coordinates': 'Should show formatted as "##.##°N, ##.##°E"',
      'busNetwork': 'Should show bus info (not snake_case: bus_network)',
      'majorLandmarks': 'Should show landmarks (not snake_case: major_landmarks)',
      'historicalSignificance': 'Should show significance (not snake_case: historical_significance)',
      'traditionalFood': 'Should show food (not snake_case: traditional_food)',
      'unescoSites': 'Should show UNESCO sites (not snake_case: unicode_sites)'
    };
    
    for (const [field, description] of Object.entries(testFields)) {
      const value = profile[field];
      const status = value !== null && value !== undefined && value !== '' ? '✅' : '❌';
      console.log(`${status} ${field}:`);
      console.log(`   Expected: ${description}`);
      console.log(`   Actual: ${value || '(empty)'}`);
      console.log();
    }
    
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
}

async function run() {
  await verifyAllCities();
  await verifyFuzuliDetail();
}

run();
