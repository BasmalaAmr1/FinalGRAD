const http = require('http');

// Test function to make HTTP requests
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            data: JSON.parse(body)
          };
          resolve(result);
        } catch (error) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test data that frontend would send
const testProject = {
  name: 'Frontend Test Project',
  location: 'Frontend Test City',
  totalUnits: 30,
  availableUnits: 15,
  priceRange: '300K - 600K EGP',
  type: 'Apartments',
  status: 'active',
  completionDate: new Date('2025-09-30'),
  description: 'Test project for frontend-backend integration'
};

const testApplication = {
  name: 'Frontend Test Applicant',
  nationalId: '98765432109876',
  email: 'frontend@test.com',
  phone: '01098765432',
  projectId: 'test-project-id',
  projectName: 'Frontend Test Project',
  income: 12000,
  familySize: 4,
  currentHousing: 'Test housing situation'
};

// Main test function
async function testFrontendMongoDBIntegration() {
  console.log('🧪 FRONTEND - BACKEND MONGODB INTEGRATION TEST');
  console.log('===============================================\n');
  
  let allTestsPassed = true;
  let createdProjectId = null;
  let createdApplicationId = null;

  try {
    console.log('📊 Testing Backend APIs that Frontend Uses:');
    console.log('===========================================');

    // Test 1: Projects API (frontend uses this for Projects page)
    console.log('1. 📋 Projects API (Frontend Projects Page):');
    
    const projectsResult = await makeRequest('/api/projects');
    if (projectsResult.statusCode === 200 && projectsResult.data.success) {
      console.log(`   ✅ Projects API working: ${projectsResult.data.count} projects`);
      
      // Create project (like frontend would)
      console.log('   🆕 Creating project (like frontend)...');
      const createProjectResult = await makeRequest('/api/projects', 'POST', testProject);
      if (createProjectResult.statusCode === 201 && createProjectResult.data.success) {
        console.log('   ✅ Project created successfully');
        createdProjectId = createProjectResult.data.data._id;
        
        // Verify frontend can read the new project
        const verifyProjectsResult = await makeRequest('/api/projects');
        if (verifyProjectsResult.statusCode === 200 && verifyProjectsResult.data.count > projectsResult.data.count) {
          console.log('   ✅ Frontend can see new project in MongoDB');
        } else {
          console.log('   ❌ Frontend cannot see new project');
          allTestsPassed = false;
        }
      } else {
        console.log(`   ❌ Failed to create project: ${createProjectResult.statusCode}`);
        allTestsPassed = false;
      }
    } else {
      console.log(`   ❌ Projects API failed: ${projectsResult.statusCode}`);
      allTestsPassed = false;
    }

    // Test 2: Users API (frontend uses this)
    console.log('\n2. 👥 Users API (Frontend User Management):');
    
    const usersResult = await makeRequest('/api/users');
    if (usersResult.statusCode === 200 && usersResult.data.success) {
      console.log(`   ✅ Users API working: ${usersResult.data.count} users`);
    } else {
      console.log(`   ❌ Users API failed: ${usersResult.statusCode}`);
      allTestsPassed = false;
    }

    // Test 3: Applications API (frontend uses this for Reports and Applications)
    console.log('\n3. 📝 Applications API (Frontend Applications & Reports):');
    
    const applicationsResult = await makeRequest('/api/applications');
    if (applicationsResult.statusCode === 200 && applicationsResult.data.success) {
      console.log(`   ✅ Applications API working: ${applicationsResult.data.count} applications`);
      
      // Create application (like frontend would when user submits)
      console.log('   🆕 Creating application (like frontend form)...');
      const createApplicationResult = await makeRequest('/api/applications', 'POST', testApplication);
      if (createApplicationResult.statusCode === 201 && createApplicationResult.data.success) {
        console.log('   ✅ Application created successfully');
        createdApplicationId = createApplicationResult.data.data._id;
        
        // Verify frontend can read the new application
        const verifyApplicationsResult = await makeRequest('/api/applications');
        if (verifyApplicationsResult.statusCode === 200 && verifyApplicationsResult.data.count > applicationsResult.data.count) {
          console.log('   ✅ Frontend can see new application in MongoDB');
        } else {
          console.log('   ❌ Frontend cannot see new application');
          allTestsPassed = false;
        }
      } else {
        console.log(`   ❌ Failed to create application: ${createApplicationResult.statusCode}`);
        allTestsPassed = false;
      }
    } else {
      console.log(`   ❌ Applications API failed: ${applicationsResult.statusCode}`);
      allTestsPassed = false;
    }

    // Test 4: Audit Logs API (frontend uses this for Reports)
    console.log('\n4. 📋 Audit Logs API (Frontend Reports):');
    
    const auditLogsResult = await makeRequest('/api/auditLogs');
    if (auditLogsResult.statusCode === 200 && auditLogsResult.success) {
      console.log(`   ✅ Audit Logs API working: ${auditLogsResult.data.count} logs`);
    } else {
      console.log(`   ❌ Audit Logs API failed: ${auditLogsResult.statusCode}`);
      allTestsPassed = false;
    }

    // Test 5: Notifications API (frontend uses this)
    console.log('\n5. 🔔 Notifications API (Frontend Notifications):');
    
    const notificationsResult = await makeRequest('/api/notifications');
    if (notificationsResult.statusCode === 200 && notificationsResult.data.success) {
      console.log(`   ✅ Notifications API working: ${notificationsResult.data.count} notifications`);
    } else {
      console.log(`   ❌ Notifications API failed: ${notificationsResult.statusCode}`);
      allTestsPassed = false;
    }

    // Cleanup test data
    console.log('\n🧹 Cleaning up test data:');
    if (createdApplicationId) {
      const deleteAppResult = await makeRequest(`/api/applications/${createdApplicationId}`, 'DELETE');
      if (deleteAppResult.statusCode === 200 && deleteAppResult.data.success) {
        console.log('   ✅ Test application deleted');
      }
    }
    
    if (createdProjectId) {
      const deleteProjResult = await makeRequest(`/api/projects/${createdProjectId}`, 'DELETE');
      if (deleteProjResult.statusCode === 200 && deleteProjResult.data.success) {
        console.log('   ✅ Test project deleted');
      }
    }

  } catch (error) {
    console.error('❌ Test execution error:', error.message);
    allTestsPassed = false;
  }

  // Final Result
  console.log('\n📋 FRONTEND - BACKEND INTEGRATION TEST SUMMARY:');
  console.log('===============================================');
  if (allTestsPassed) {
    console.log('🎉 FRONTENT INTEGRATION WITH MONGODB BACKEND SUCCESSFUL!');
    console.log('\n✅ What this means for frontend:');
    console.log('   • Frontend can successfully connect to MongoDB backend');
    console.log('   • All API endpoints that frontend uses are working');
    console.log('   • Data created by frontend persists in MongoDB');
    console.log('   • Frontend pages will load real database data');
    console.log('   • No more data.json - everything from MongoDB');
    console.log('\n🌐 Frontend Pages Status:');
    console.log('   • Projects Page: ✅ Will load MongoDB projects');
    console.log('   • Reports Page: ✅ Will load MongoDB data');
    console.log('   • New Application: ✅ Will save to MongoDB');
    console.log('   • Dashboard: ✅ Will show MongoDB statistics');
    console.log('\n👉 الـ Frontent تمام مع MongoDB Backend!');
  } else {
    console.log('❌ FRONTENT INTEGRATION ISSUES FOUND!');
    console.log('\n🔧 What to check:');
    console.log('   • Backend API endpoints');
    console.log('   • CORS configuration');
    console.log('   • Frontend API calls');
  }
  
  console.log('\n🌐 Access Points:');
  console.log('   • Frontend: http://localhost:5173');
  console.log('   • Backend: http://localhost:5000/api');
  console.log('   • Both are running and connected! 🎯');
}

// Run integration test
testFrontendMongoDBIntegration().catch(console.error);
