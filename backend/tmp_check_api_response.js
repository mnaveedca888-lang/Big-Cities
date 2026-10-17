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

async function checkAPI() {
  try {
    console.log('Checking Fuzuli API response...\n');
    const fuzuli = await makeRequest('/api/countries/AZ/cities/az-fuzuli');
    
    if (!fuzuli) {
      console.log('No response from API. Make sure backend is running on port 3000');
      return;
    }

    console.log('Fuzuli profile keys:');
    const profile = fuzuli.profile || {};
    const keys = Object.keys(profile).sort();
    
    for (const key of keys) {
      const value = profile[key];
      let displayValue = '';
      if (Array.isArray(value)) {
        displayValue = `[${value.length} items]`;
      } else if (typeof value === 'object') {
        displayValue = JSON.stringify(value).substring(0, 50);
      } else if (typeof value === 'string') {
        displayValue = value.substring(0, 50);
      } else {
        displayValue = String(value);
      }
      
      console.log(`  "${key}": ${displayValue}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

setTimeout(checkAPI, 2000);
