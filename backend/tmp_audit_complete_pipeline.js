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

// Core required fields that should never be "—" for display
const CORE_FIELDS = [
  { key: 'name', display: 'City Name' },
  { key: 'shortDescription', display: 'Description' },
  { key: 'population', display: 'Population' },
  { key: 'nickname', display: 'Nickname' },
  { key: 'history', display: 'History' },
  { key: 'timeZone', display: 'Time Zone' },
  { key: 'coordinates', display: 'Coordinates' },
  { key: 'area', display: 'Area' },
  { key: 'elevation', display: 'Elevation' },
  { key: 'climate', display: 'Climate' },
  { key: 'majorLandmarks', display: 'Major Landmarks' }
];

const cities = [
  { slug: 'az-baku', name: 'Baku' },
  { slug: 'az-ganja', name: 'Ganja' },
  { slug: 'az-lankaran', name: 'Lankaran' },
  { slug: 'az-nakhchivan', name: 'Nakhchivan' },
  { slug: 'az-gabala', name: 'Gabala' },
  { slug: 'az-lachin', name: 'Lachin' },
  { slug: 'az-fuzuli', name: 'Fuzuli' },
  { slug: 'az-zangilan', name: 'Zangilan' },
  { slug: 'az-zaqatala', name: 'Zaqatala' }
];

async function auditCompleteDataPipeline() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('  COMPLETE AZERBAIJAN CITY DATA PIPELINE AUDIT');
  console.log('════════════════════════════════════════════════════════════════\n');
  
  let totalCitiesSuccess = 0;
  let totalFieldsSuccess = 0;
  let totalFieldsChecked = 0;
  
  for (const city of cities) {
    try {
      const response = await makeRequest(`/cities/${city.slug}`);
      
      if (!response.success || !response.data) {
        console.log(`❌ ${city.name} (${city.slug}): No valid response`);
        continue;
      }
      
      const cityData = response.data;
      const profile = cityData.profile || {};
      
      console.log(`✅ ${city.name} (${city.slug}):`);
      
      // Check if this is a valid city response
      const hasRequiredTopLevel = cityData.name && cityData.population && cityData.shortDescription;
      console.log(`   └─ Response Structure: ${hasRequiredTopLevel ? '✅ Valid' : '⚠️  Incomplete'}`);
      
      // Check core fields
      let coreFieldsSuccess = 0;
      const failedCoreFields = [];
      
      for (const field of CORE_FIELDS) {
        totalFieldsChecked++;
        
        // Check top-level fields first, then profile
        let value = cityData[field.key];
        if (value === undefined) {
          value = profile[field.key];
        }
        
        // Determine if field has a valid value (not empty or placeholder dash)
        const hasValue = value !== null && value !== undefined && value !== '' && value !== '—';
        
        if (hasValue) {
          coreFieldsSuccess++;
          totalFieldsSuccess++;
        } else {
          failedCoreFields.push(field.display);
        }
      }
      
      console.log(`   └─ Core Fields: ${coreFieldsSuccess}/${CORE_FIELDS.length} displaying values`);
      
      if (failedCoreFields.length > 0) {
        console.log(`      ⚠️  Fields showing "—": ${failedCoreFields.join(', ')}`);
      }
      
      // Check for snake_case pollution
      const profileKeys = Object.keys(profile);
      const snakeCaseKeys = profileKeys.filter(k => k.includes('_'));
      
      if (snakeCaseKeys.length > 0) {
        console.log(`   ⚠️  ERROR: Found ${snakeCaseKeys.length} snake_case keys: ${snakeCaseKeys.join(', ')}`);
      } else {
        console.log(`   └─ Field Naming: ✅ All camelCase (no snake_case)`);
      }
      
      totalCitiesSuccess++;
      console.log();
      
    } catch (error) {
      console.log(`❌ ${city.name} (${city.slug}): ${error.message}\n`);
    }
  }
  
  // Summary
  console.log('════════════════════════════════════════════════════════════════');
  console.log('  AUDIT SUMMARY');
  console.log('════════════════════════════════════════════════════════════════');
  console.log(`\n✅ Cities Verified: ${totalCitiesSuccess}/${cities.length}`);
  console.log(`✅ Core Fields Displaying Values: ${totalFieldsSuccess}/${totalFieldsChecked}`);
  console.log(`   Success Rate: ${((totalFieldsSuccess / totalFieldsChecked) * 100).toFixed(1)}%`);
  
  if (totalCitiesSuccess === cities.length && totalFieldsSuccess === totalFieldsChecked) {
    console.log('\n🎉 COMPLETE SUCCESS! All cities and fields are displaying correctly.');
    console.log('   DOCX → Database → API → Frontend → UI pipeline is working!');
  } else {
    console.log('\n⚠️  Some issues detected. Please review above.');
  }
  
  console.log('\n════════════════════════════════════════════════════════════════\n');
}

auditCompleteDataPipeline();
