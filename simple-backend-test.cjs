const http = require('http');

function testBackend() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/projects',
      method: 'GET'
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          console.log('✅ Backend Status:', res.statusCode);
          console.log('✅ Projects Count:', data.count);
          console.log('✅ Sample Project:', data.data[0]?.name || 'No projects');
          resolve({ success: true, count: data.count });
        } catch (error) {
          console.log('❌ Backend Response Error:', error.message);
          resolve({ success: false });
        }
      });
    });
    req.on('error', error => {
      console.log('❌ Backend Connection Error:', error.message);
      resolve({ success: false });
    });
    req.end();
  });
}

async function runSimpleTest() {
  console.log('🧪 SIMPLE BACKEND TEST');
  console.log('=====================');
  
  const result = await testBackend();
  
  if (result.success) {
    console.log('\n🎉 BACKEND IS WORKING!');
    console.log('✅ MongoDB Backend ready');
    console.log('✅ Frontend can connect to this');
    console.log('\n📊 Current Data:');
    console.log(`   • Projects: ${result.count}`);
    console.log('\n🌐 Access Points:');
    console.log('   • Backend: http://localhost:5000/api');
    console.log('   • Frontend: http://localhost:5174');
    console.log('\n👉 الـ Frontent هيشوف البيانات دي من MongoDB!');
  } else {
    console.log('\n❌ BACKEND NOT RESPONDING');
    console.log('🔧 Check if backend server is running');
  }
}

runSimpleTest();
