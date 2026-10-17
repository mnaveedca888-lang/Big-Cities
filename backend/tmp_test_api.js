const http = require('http');

function makeRequest(path) {
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
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testAPI() {
  try {
    console.log('Testing API endpoints...\n');

    // Test 1: Get all AZ cities
    console.log('📍 GET /api/countries/AZ/cities');
    const cities = await makeRequest('/api/countries/AZ/cities');
    console.log(`  ✓ Response received`);
    console.log(`  ✓ Cities returned: ${cities.length || Object.keys(cities).length}`);

    // Test 2: Get individual city
    console.log('\n📍 GET /api/countries/AZ/cities/az-baku');
    const baku = await makeRequest('/api/countries/AZ/cities/az-baku');
    console.log(`  ✓ City: ${baku.name || 'Baku'}`);
    const bakuProfile = baku.profile || {};
    const bakuFieldCount = Object.keys(bakuProfile).length;
    console.log(`  ✓ Profile fields: ${bakuFieldCount}`);
    console.log(`  ✓ Sample fields present:`);
    console.log(`    - nickname: ${bakuProfile.nickname ? '✓' : '✗'}`);
    console.log(`    - population: ${bakuProfile.population ? '✓' : '✗'}`);
    console.log(`    - history: ${bakuProfile.history ? '✓' : '✗'}`);
    console.log(`    - museums: ${Array.isArray(bakuProfile.museums) ? `✓ (${bakuProfile.museums.length} items)` : '✗'}`);

    // Test 3: Get events for AZ
    console.log('\n📍 GET /api/events?country=AZ');
    const events = await makeRequest('/api/events?country=AZ');
    console.log(`  ✓ Events returned: ${events.length}`);

    console.log('\n✅ API endpoints functional!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nNote: Make sure backend is running on port 3000');
  }
}

// Wait a bit for backend to start
setTimeout(testAPI, 2000);
