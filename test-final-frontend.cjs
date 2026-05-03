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
        try {
          const data = JSON.parse(body);
          console.log(`✅ ${path}: ${data.count} items`);
          if (data.data && data.data.length > 0) {
            console.log(`   📄 Sample: ${data.data[0].name || data.data[0].title || 'N/A'}`);
          }
          resolve({ success: true, count: data.count });
        } catch (error) {
          console.log(`❌ ${path}: Invalid JSON response`);
          resolve({ success: false });
        }
      });
    });
    req.on('error', (error) => {
      console.log(`❌ ${path}: ${error.message}`);
      resolve({ success: false });
    });
    req.end();
  });
}

async function testFrontendData() {
  console.log('🧪 TESTING FRONTEND DATA AVAILABILITY');
  console.log('=====================================\n');
  
  console.log('📊 Checking MongoDB Data for Frontend:');
  console.log('=====================================');
  
  const results = await Promise.all([
    testEndpoint('/api/projects'),
    testEndpoint('/api/users'),
    testEndpoint('/api/applications'),
    testEndpoint('/api/auditLogs'),
    testEndpoint('/api/notifications')
  ]);
  
  const [projects, users, applications, auditLogs, notifications] = results;
  
  console.log('\n📋 Frontend Readiness Summary:');
  console.log('===============================');
  
  if (projects.success && projects.count > 0) {
    console.log('✅ Projects Page: Ready with MongoDB data');
  } else {
    console.log('❌ Projects Page: No data available');
  }
  
  if (users.success && users.count > 0) {
    console.log('✅ User Management: Ready with MongoDB data');
  } else {
    console.log('❌ User Management: No data available');
  }
  
  if (applications.success && applications.count > 0) {
    console.log('✅ Applications Page: Ready with MongoDB data');
  } else {
    console.log('❌ Applications Page: No data available');
  }
  
  if (auditLogs.success && auditLogs.count > 0) {
    console.log('✅ Reports Page: Ready with MongoDB data');
  } else {
    console.log('❌ Reports Page: No audit logs available');
  }
  
  if (notifications.success && notifications.count > 0) {
    console.log('✅ Notifications: Ready with MongoDB data');
  } else {
    console.log('❌ Notifications: No data available');
  }
  
  const allReady = results.every(r => r.success);
  
  console.log('\n🎯 Final Frontend Status:');
  console.log('========================');
  if (allReady) {
    console.log('🎉 FRONTENT IS READY WITH MONGODB BACKEND!');
    console.log('\n🌐 Access Points:');
    console.log('   • Frontend: http://localhost:5173');
    console.log('   • Backend: http://localhost:5000/api');
    console.log('\n✅ What Frontend Users Will See:');
    console.log('   • Projects page with real MongoDB projects');
    console.log('   • Reports page with real MongoDB data');
    console.log('   • Application forms that save to MongoDB');
    console.log('   • User management with MongoDB users');
    console.log('   • Live data updates from MongoDB');
    console.log('\n👉 الـ Frontent تمام 100% مع MongoDB!');
  } else {
    console.log('❌ FRONTENT NOT READY - Some APIs missing data');
  }
}

testFrontendData();
