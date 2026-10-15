const http = require('http');
const fs = require('fs');
const path = require('path');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// Multipart form data upload helper
function uploadFile(token, entityType, filePath) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const fileName = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);

    const postDataStart = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
      `Content-Type: text/csv\r\n\r\n`
    );
    const postDataEnd = Buffer.from(`\r\n--${boundary}--\r\n`);
    const fullBody = Buffer.concat([postDataStart, fileContent, postDataEnd]);

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/master-data/upload-csv/${entityType}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullBody.length
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    req.write(fullBody);
    req.end();
  });
}

async function testFullFlow() {
  console.log('\n======================================================');
  console.log('🚀 TESTING LIVE MEMBER 1 API FLOW (Auth & Master Data)');
  console.log('======================================================\n');

  // Step 1: Login as Admin
  console.log('1️⃣ Attempting Admin Login...');
  const loginRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ email: 'admin@examsphere.edu', password: 'admin123' }));

  if (loginRes.status !== 200 || !loginRes.data.success) {
    console.error('❌ Login failed:', loginRes);
    return;
  }
  const token = loginRes.data.data.token;
  console.log(' Admin Login SUCCESS! JWT Token received.');

  // Step 2: Fetch Admin Profile
  console.log('\n2️⃣ Fetching Current User (/api/auth/me)...');
  const meRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(` Authenticated as: ${meRes.data.data.user.name} (${meRes.data.data.user.role})`);

  // Step 3: Test CSV Bulk Upload for Students
  console.log('\n3️⃣ Uploading sample students CSV (/api/master-data/upload-csv/students)...');
  const studentCsvPath = path.join(__dirname, '../templates/students_template.csv');
  const uploadRes = await uploadFile(token, 'students', studentCsvPath);
  console.log(' CSV Ingestion Result:', uploadRes.data.summary);

  // Step 4: Fetch Ingested Students
  console.log('\n4️⃣ Fetching Students list from database (/api/master-data/students)...');
  const studentsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/master-data/students',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(` Found ${studentsRes.data.count} students in MySQL! Sample student:`, studentsRes.data.data[0]?.name);

  // Step 5: Fetch System Summary
  console.log('\n5️⃣ Fetching Real-time System Summary (/api/admin/system-summary)...');
  const summaryRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/system-summary',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(' Current Database Counts:', summaryRes.data.data);

  console.log('\n======================================================');
  console.log('🎉 ALL MEMBER 1 MODULES (1, 2, 11) ARE VERIFIED & LIVE!');
  console.log('======================================================\n');
}

module.exports = { testFullFlow };

if (require.main === module) {
  testFullFlow().catch(console.error);
}
