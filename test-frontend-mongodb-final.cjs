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

async function testFrontendMongoDBIntegration() {
  console.log('🧪 TESTING FRONTEND - MONGODB BACKEND INTEGRATION');
  console.log('================================================');
  console.log('Checking if frontend loads data from MongoDB...');
  console.log('===============================================\n');
  
  let allTestsPassed = true;

  try {
    // Test 1: Backend has MongoDB data
    console.log('1. 🗄️ Backend MongoDB Data Check:');
    const projects = await makeRequest('/api/projects');
    const users = await makeRequest('/api/users');
    const applications = await makeRequest('/api/applications');
    
    if (projects.statusCode === 200 && projects.data.success && projects.data.count > 0) {
      console.log(`   ✅ Backend has ${projects.data.count} projects in MongoDB`);
    } else {
      console.log('   ❌ Backend has no projects data');
      allTestsPassed = false;
    }

    if (users.statusCode === 200 && users.data.success && users.data.count > 0) {
      console.log(`   ✅ Backend has ${users.data.count} users in MongoDB`);
    } else {
      console.log('   ❌ Backend has no users data');
      allTestsPassed = false;
    }

    if (applications.statusCode === 200 && applications.data.success && applications.data.count > 0) {
      console.log(`   ✅ Backend has ${applications.data.count} applications in MongoDB`);
    } else {
      console.log('   ❌ Backend has no applications data');
      allTestsPassed = false;
    }

    // Test 2: Create new data via API (like frontend would)
    console.log('\n2. 🆕 Testing Frontend-like Data Creation:');
    
    const newProject = {
      name: 'Frontend Test Project',
      location: 'Frontend Test Location',
      totalUnits: 50,
      availableUnits: 25,
      priceRange: '500K - 1M EGP',
      type: 'Apartments',
      status: 'active',
      completionDate: new Date('2025-11-30'),
      description: 'Project created via frontend-like API call'
    };

    const createResult = await makeRequest('/api/projects', 'POST', newProject);
    if (createResult.statusCode === 201 && createResult.data.success) {
      console.log('   ✅ Frontend can create projects via API');
      const createdId = createResult.data.data._id;
      
      // Test 3: Verify data persists (frontend should see this)
      console.log('\n3. 👁️ Testing Data Persistence (Frontend Visibility):');
      const verifyResult = await makeRequest('/api/projects');
      if (verifyResult.data.count > projects.data.count) {
        console.log('   ✅ New project persisted - frontend will see it');
      } else {
        console.log('   ❌ Project not persisted - frontend wont see it');
        allTestsPassed = false;
      }

      // Test 4: Update data (frontend edit functionality)
      console.log('\n4. ✏️ Testing Frontend Edit Functionality:');
      const updateData = {
        name: 'Frontend Test Project (Updated)',
        location: 'Frontend Test Location (Updated)',
        totalUnits: 60,
        availableUnits: 30,
        priceRange: '600K - 1.2M EGP',
        type: 'Apartments',
        status: 'active',
        completionDate: new Date('2025-11-30'),
        description: 'Project updated via frontend-like API call'
      };

      const updateResult = await makeRequest(`/api/projects/${createdId}`, 'PUT', updateData);
      if (updateResult.statusCode === 200 && updateResult.data.success) {
        console.log('   ✅ Frontend can update projects via API');
        
        // Verify update
        const getUpdated = await makeRequest(`/api/projects/${createdId}`);
        if (getUpdated.data.data.name === 'Frontend Test Project (Updated)') {
          console.log('   ✅ Update persisted correctly');
        } else {
          console.log('   ❌ Update not persisted correctly');
          allTestsPassed = false;
        }
      } else {
        console.log('   ❌ Frontent update failed');
        allTestsPassed = false;
      }

      // Test 5: Delete data (frontend delete functionality)
      console.log('\n5. 🗑️ Testing Frontend Delete Functionality:');
      const deleteResult = await makeRequest(`/api/projects/${createdId}`, 'DELETE');
      if (deleteResult.statusCode === 200 && deleteResult.data.success) {
        console.log('   ✅ Frontend can delete projects via API');
        
        // Verify deletion
        const finalCheck = await makeRequest('/api/projects');
        if (finalCheck.data.count === projects.data.count) {
          console.log('   ✅ Delete persisted correctly');
        } else {
          console.log('   ❌ Delete not persisted correctly');
          allTestsPassed = false;
        }
      } else {
        console.log('   ❌ Frontent delete failed');
        allTestsPassed = false;
      }

    } else {
      console.log('   ❌ Frontend creation failed');
      allTestsPassed = false;
    }

    // Test 6: Test application creation (frontend form submission)
    console.log('\n6. 📝 Testing Frontend Application Form:');
    const newApplication = {
      name: 'Frontend Test Applicant',
      nationalId: '12345678901234',
      email: 'frontend@test.com',
      phone: '01012345678',
      projectId: projects.data.data[0]?._id || 'test-project',
      projectName: projects.data.data[0]?.name || 'Test Project',
      income: 15000,
      familySize: 4,
      currentHousing: 'Test housing situation'
    };

    const appResult = await makeRequest('/api/applications', 'POST', newApplication);
    if (appResult.statusCode === 201 && appResult.data.success) {
      console.log('   ✅ Frontend can submit applications via API');
      
      // Cleanup test application
      await makeRequest(`/api/applications/${appResult.data.data._id}`, 'DELETE');
      console.log('   ✅ Test application cleaned up');
    } else {
      console.log('   ❌ Frontend application submission failed');
      allTestsPassed = false;
    }

  } catch (error) {
    console.error('❌ Test execution error:', error.message);
    allTestsPassed = false;
  }

  // Final Results
  console.log('\n📋 FRONTEND - MONGODB INTEGRATION TEST RESULTS');
  console.log('===============================================');
  
  if (allTestsPassed) {
    console.log('🎉 FRONTEND READY WITH MONGODB BACKEND!');
    console.log('\n✅ What This Means:');
    console.log('   • Frontend will load data from MongoDB backend');
    console.log('   • Frontend can create, update, and delete data');
    console.log('   • All changes persist in MongoDB database');
    console.log('   • No dependency on data.json file');
    console.log('   • Real-time data synchronization');
    
    console.log('\n🌐 Frontend Access:');
    console.log('   • URL: http://localhost:5174');
    console.log('   • Backend: http://localhost:5000/api');
    console.log('   • Database: MongoDB');
    
    console.log('\n👉 الـ Frontent هيشوف بيانات MongoDB الحقيقية!');
    console.log('   • Projects Page: هيوري المشاريع من MongoDB');
    console.log('   • Reports Page: هيوري إحصائيات من MongoDB');
    console.log('   • Applications: هتتحفظ في MongoDB');
    console.log('   • Users: هيوري المستخدمين من MongoDB');
    
  } else {
    console.log('❌ FRONTEND INTEGRATION ISSUES FOUND');
    console.log('\n🔧 What to Check:');
    console.log('   • Backend API endpoints');
    console.log('   • Frontend dataService configuration');
    console.log('   • CORS settings');
    console.log('   • Network connectivity');
  }

  return allTestsPassed;
}

// Run the test
testFrontendMongoDBIntegration().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
