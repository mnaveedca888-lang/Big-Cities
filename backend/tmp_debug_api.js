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
          resolve({ raw: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function debugAPI() {
  try {
    console.log('Testing /api/cities/az-fuzuli...\n');
    const response = await makeRequest('/api/cities/az-fuzuli');
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

setTimeout(debugAPI, 1000);
