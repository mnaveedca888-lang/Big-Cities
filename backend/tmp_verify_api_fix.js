const http = require('http');
const fs = require('fs');

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
          resolve(null);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function verifyFix() {
  try {
    console.log('Testing API with camelCase field names...\n');
    
    const fuzuli = await makeRequest('/api/cities/az-fuzuli');
    
    if (!fuzuli) {
      console.log('❌ No response from API');
      return;
    }

    const profile = fuzuli.profile || {};
    
    console.log('✅ Fuzuli profile structure:');
    console.log(`\nProfile has ${Object.keys(profile).length} fields\n`);

    // Check for critical fields
    const criticalFields = [
      'overview', 'nickname', 'history', 'founded', 'historicalSignificance',
      'area', 'elevation', 'rivers', 'climate', 'coordinates',
      'unescoSites', 'famousLandmarks', 'museums', 'parks',
      'traditionalFood', 'streetFood', 'popularRestaurants',
      'festivals', 'culturalEvents', 'arts', 'music'
    ];

    const report = {
      city: 'Fuzuli',
      total_fields: Object.keys(profile).length,
      fields_with_values: {},
      missing_fields: []
    };

    for (const field of criticalFields) {
      const value = profile[field];
      if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        report.missing_fields.push(field);
      } else {
        if (Array.isArray(value)) {
          report.fields_with_values[field] = `[${value.length} items]`;
        } else if (typeof value === 'object') {
          report.fields_with_values[field] = JSON.stringify(value).substring(0, 50);
        } else {
          report.fields_with_values[field] = String(value).substring(0, 80);
        }
      }
    }

    console.log('Fields with values:');
    for (const [field, value] of Object.entries(report.fields_with_values)) {
      console.log(`  ✓ ${field}: ${value}`);
    }

    if (report.missing_fields.length > 0) {
      console.log(`\nMissing fields (${report.missing_fields.length}):`);
      for (const field of report.missing_fields) {
        console.log(`  ✗ ${field}`);
      }
    } else {
      console.log('\n✅ All critical fields present!');
    }

    // Check specific fixes
    console.log('\n\nSpecific Fixes Verification:');
    console.log(`1. Coordinates formatting:
     DB stored as: {latitude, longitude}
     API returns: "${profile.coordinates || '(missing)'}"
     Status: ${typeof profile.coordinates === 'string' && profile.coordinates.includes('°') ? '✅' : '❌'}`);

    console.log(`\n2. UNESCO Sites field name:
     Previous name: unicode_sites (wrong)
     New name: unescoSites (camelCase)
     Status: ${'unescoSites' in profile ? '✅' : '❌'}`);

    console.log(`\n3. camelCase conversion:
     Sample fields:
     - "major_landmarks" → "${Object.keys(profile).includes('majorLandmarks') ? 'majorLandmarks ✅' : 'NOT FOUND ❌'}"
     - "popular_restaurants" → "${Object.keys(profile).includes('popularRestaurants') ? 'popularRestaurants ✅' : 'NOT FOUND ❌'}"
     - "traditional_food" → "${Object.keys(profile).includes('traditionalFood') ? 'traditionalFood ✅' : 'NOT FOUND ❌'}"
     - "time_zone" → "${Object.keys(profile).includes('timeZone') ? 'timeZone ✅' : 'NOT FOUND ❌'}"`);

    // Save detailed report
    fs.writeFileSync('API_RESPONSE_VERIFICATION.json', JSON.stringify(report, null, 2));
    console.log('\n\n✅ Detailed report saved to API_RESPONSE_VERIFICATION.json');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Give server time to start
setTimeout(verifyFix, 3000);
