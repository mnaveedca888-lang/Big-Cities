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

async function showFixedStructure() {
  console.log('═══════════════════════════════════════════════════════════════════\n');
  console.log('FUZULI CITY - API RESPONSE STRUCTURE (AFTER FIX)');
  console.log('\n═══════════════════════════════════════════════════════════════════\n');
  
  try {
    const response = await makeRequest('/cities/az-fuzuli');
    const data = response.data;
    const profile = data.profile || {};
    
    console.log('TOP-LEVEL FIELDS:');
    console.log(`  ✅ name: ${data.name}`);
    console.log(`  ✅ slug: ${data.slug}`);
    console.log(`  ✅ countryCode: ${data.countryCode}`);
    console.log(`  ✅ population: ${data.population}`);
    console.log(`  ✅ shortDescription: ${data.shortDescription}`);
    console.log(`  ✅ image: ${data.image ? '(URL)' : 'null'}\n`);
    
    console.log('PROFILE FIELDS (in camelCase - all previously showing "—"):\n');
    
    const displayFields = [
      { key: 'nickname', label: 'Nickname' },
      { key: 'timeZone', label: 'Time Zone' },
      { key: 'coordinates', label: 'Coordinates (formatted)' },
      { key: 'area', label: 'Area (km²)' },
      { key: 'elevation', label: 'Elevation (m)' },
      { key: 'climate', label: 'Climate' },
      { key: 'population', label: 'Population' },
      { key: 'history', label: 'History' },
      { key: 'founded', label: 'Founded' },
      { key: 'majorLandmarks', label: 'Major Landmarks' },
      { key: 'busNetwork', label: 'Bus Network' },
      { key: 'timeZone', label: 'Time Zone' },
      { key: 'postalCode', label: 'Postal Code' },
      { key: 'traditionalFood', label: 'Traditional Food' },
      { key: 'historicalSignificance', label: 'Historical Significance' },
      { key: 'moviesFilmed', label: 'Movies Filmed' },
      { key: 'tvShows', label: 'TV Shows' },
      { key: 'unescoSites', label: 'UNESCO Sites' }
    ];
    
    for (const field of displayFields) {
      const value = profile[field.key];
      const hasValue = value !== null && value !== undefined && value !== '';
      const icon = hasValue ? '✅' : '(empty)';
      
      if (value && value.length > 70) {
        console.log(`  ${icon} ${field.label} (${field.key}):`);
        console.log(`      "${value.substring(0, 70)}..."`);
      } else if (value) {
        console.log(`  ${icon} ${field.label} (${field.key}):`);
        console.log(`      "${value}"`);
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════════\n');
    console.log('✅ FIELD NAMING VERIFICATION:');
    console.log(`   Total profile fields: ${Object.keys(profile).length}`);
    
    const snakeCaseFields = Object.keys(profile).filter(k => k.includes('_'));
    const camelCaseFields = Object.keys(profile).filter(k => !k.includes('_'));
    
    console.log(`   ✅ camelCase fields: ${camelCaseFields.length}`);
    console.log(`   ✅ snake_case fields: ${snakeCaseFields.length}`);
    
    if (snakeCaseFields.length === 0) {
      console.log('\n   ✅ PERFECT: No snake_case pollution in response!');
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

showFixedStructure();
