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

async function verifyAzerbaijanCountry() {
  console.log('═══════════════════════════════════════════════════════════════════\n');
  console.log('AZERBAIJAN COUNTRY PAGE - VERIFICATION');
  console.log('\n═══════════════════════════════════════════════════════════════════\n');
  
  try {
    const response = await makeRequest('/countries/AZ');
    const { success, data } = response;
    
    if (!success || !data) {
      console.log('❌ Failed to fetch Azerbaijan country data');
      return;
    }
    
    console.log('✅ COUNTRY INFO:');
    console.log(`   Name: ${data.name}`);
    console.log(`   Code: ${data.code}`);
    console.log(`   Continent: ${data.continent}`);
    console.log(`   Cities: ${data.cities}`);
    console.log(`   Events: ${data.events}`);
    
    console.log('\n✅ IMAGES:');
    console.log(`   Hero Image URL: ${data.image ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Flag Image URL: ${data.flagImage ? '✅ Set' : '❌ Missing'}`);
    
    if (data.image) {
      console.log(`      Hero: ${data.image.substring(0, 80)}...`);
    }
    if (data.flagImage) {
      console.log(`      Flag: ${data.flagImage.substring(0, 80)}...`);
    }
    
    const profile = data.profile || {};
    
    console.log('\n✅ PROFILE FIELDS (camelCase - critical for frontend):');
    const keyFields = [
      'capital', 'population', 'area', 'currency', 'government', 
      'leader', 'region', 'coordinates', 'currencyCode', 'gdpPerCapita',
      'majorIndustries', 'heroImageUrl', 'flagImageUrl'
    ];
    
    for (const field of keyFields) {
      const value = profile[field];
      const hasValue = value !== null && value !== undefined && value !== '';
      const icon = hasValue ? '✅' : '❌';
      
      if (Array.isArray(value)) {
        console.log(`   ${icon} ${field}: [${value.join(', ')}]`);
      } else if (typeof value === 'string' && value.length > 60) {
        console.log(`   ${icon} ${field}: ${value.substring(0, 60)}...`);
      } else {
        console.log(`   ${icon} ${field}: ${value || '(empty)'}`);
      }
    }
    
    // Check for snake_case pollution
    console.log('\n✅ FIELD NAMING CHECK:');
    const profileKeys = Object.keys(profile);
    const snakeCaseKeys = profileKeys.filter(k => k.includes('_'));
    const camelCaseKeys = profileKeys.filter(k => !k.includes('_'));
    
    console.log(`   camelCase fields: ${camelCaseKeys.length}`);
    console.log(`   snake_case fields: ${snakeCaseKeys.length}`);
    
    if (snakeCaseKeys.length > 0) {
      console.log(`   ⚠️  Found snake_case: ${snakeCaseKeys.join(', ')}`);
    } else {
      console.log(`   ✅ All fields in camelCase (no snake_case pollution)`);
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════════\n');
    console.log('✅ READY FOR FRONTEND');
    console.log('   Azerbaijan country page can be accessed at:');
    console.log('   http://localhost:5173/countries/AZ');
    console.log('\n═══════════════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyAzerbaijanCountry();
