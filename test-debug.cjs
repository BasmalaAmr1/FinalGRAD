const http = require('http');

function testEndpoint(path) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET'
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`\n=== ${path} ===`);
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${body}`);
        resolve({ statusCode: res.statusCode, body });
      });
    });
    req.on('error', (error) => {
      console.log(`Error for ${path}: ${error.message}`);
      resolve({ error: error.message });
    });
    req.end();
  });
}

async function debugEndpoints() {
  console.log('🔍 DEBUGGING BACKEND ENDPOINTS');
  console.log('=============================');
  
  await testEndpoint('/api/health');
  await testEndpoint('/api/projects');
  await testEndpoint('/api/users');
  await testEndpoint('/api/applications');
  await testEndpoint('/api/auditLogs');
  await testEndpoint('/api/notifications');
}

debugEndpoints();
