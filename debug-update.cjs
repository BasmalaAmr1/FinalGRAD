const http = require('http');

function debugUpdate() {
  const testProject = {
    name: 'Debug Test Project',
    location: 'Test Location',
    totalUnits: 100,
    availableUnits: 50,
    priceRange: '1M - 2M EGP',
    type: 'Apartments',
    status: 'active',
    completionDate: new Date('2025-12-31'),
    description: 'Debug test project'
  };

  // Create project first
  const createReq = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/projects',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      try {
        const result = JSON.parse(body);
        console.log('✅ Project created:', result.data._id);
        
        // Now try to update it
        const updateData = { name: 'Updated Debug Test Project' };
        const updateReq = http.request({
          hostname: 'localhost',
          port: 5000,
          path: `/api/projects/${result.data._id}`,
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
        }, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try {
              const updateResult = JSON.parse(body);
              console.log(`Update Status: ${res.statusCode}`);
              console.log('Update Response:', JSON.stringify(updateResult, null, 2));
              
              // Clean up
              const deleteReq = http.request({
                hostname: 'localhost',
                port: 5000,
                path: `/api/projects/${result.data._id}`,
                method: 'DELETE'
              }, (res) => {
                res.on('data', () => {});
                res.on('end', () => console.log('✅ Test project deleted'));
              });
              deleteReq.end();
            } catch (error) {
              console.log('❌ Update response parse error:', error.message);
            }
          });
        });
        updateReq.on('error', error => console.log('❌ Update request error:', error.message));
        updateReq.write(JSON.stringify(updateData));
        updateReq.end();
        
      } catch (error) {
        console.log('❌ Create response parse error:', error.message);
      }
    });
  });
  
  createReq.on('error', error => console.log('❌ Create request error:', error.message));
  createReq.write(JSON.stringify(testProject));
  createReq.end();
}

debugUpdate();
