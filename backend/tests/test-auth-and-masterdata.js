const path = require('path');
const fs = require('fs');
const os = require('os');
const jwt = require('jsonwebtoken');
const { hashPassword, comparePassword } = require('../utils/passwordHelper');
const { parseAndValidateCSV } = require('../utils/csvParser');

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING MEMBER 1 TESTS (Headless Unit Tests)');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  // Test 1: Password Hashing & Bcrypt Comparison
  total++;
  try {
    const rawPass = 'SecretExam2026';
    const hash = await hashPassword(rawPass);
    const matches = await comparePassword(rawPass, hash);
    const wrongMatches = await comparePassword('WrongPassword', hash);

    if (matches && !wrongMatches) {
      console.log(' [TEST 1 PASSED] Password Hashing & Secure Verification verified.');
      passed++;
    } else {
      console.error('❌ [TEST 1 FAILED] Password matching failed.');
    }
  } catch (err) {
    console.error('❌ [TEST 1 FAILED]', err.message);
  }

  // Test 2: JWT Token Generation & Decoding
  total++;
  try {
    const payload = { id: 1, email: 'admin@examsphere.edu', role: 'ADMIN', name: 'Exam Admin' };
    const secret = 'test_secret_key';
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    const decoded = jwt.verify(token, secret);

    if (decoded.email === payload.email && decoded.role === 'ADMIN') {
      console.log(' [TEST 2 PASSED] JWT Token Generation & Role Payload verified.');
      passed++;
    } else {
      console.error('❌ [TEST 2 FAILED] Token decoding returned unexpected values.');
    }
  } catch (err) {
    console.error('❌ [TEST 2 FAILED]', err.message);
  }

  // Test 3: CSV Stream Parser on Students
  total++;
  try {
    const tempStudents = path.join(os.tmpdir(), `temp_students_${Date.now()}.csv`);
    fs.writeFileSync(tempStudents, 'enrollment_no,name,email,department,semester,program,enrolled_courses\n240101,Aarav Sharma,aarav@bmu.edu.in,CSE,4,B.Tech,"CSE3005, CSE3002"\n240102,Ananya Verma,ananya@bmu.edu.in,CSE,4,B.Tech,"CSE3005"\n240103,Rohan Gupta,rohan@bmu.edu.in,ECE,4,B.Tech,"ECE2001"\n240104,Pooja Patel,pooja@bmu.edu.in,ECE,4,B.Tech,"ECE2001"\n240105,Aditya Roy,aditya@bmu.edu.in,CSE,4,B.Tech,"CSE3005"\n240106,Ishaan Joshi,ishaan@bmu.edu.in,CSE,4,B.Tech,"CSE3002"');
    const { validRows, errorRows } = await parseAndValidateCSV(tempStudents, 'students');
    try { fs.unlinkSync(tempStudents); } catch {}

    if (validRows.length === 6 && errorRows.length === 0) {
      console.log(` [TEST 3 PASSED] Students CSV parsed correctly (${validRows.length} valid rows found).`);
      passed++;
    } else {
      console.error(`❌ [TEST 3 FAILED] Unexpected row counts. Valid: ${validRows.length}, Errors: ${errorRows.length}`);
    }
  } catch (err) {
    console.error('❌ [TEST 3 FAILED]', err.message);
  }

  // Test 4: CSV Stream Parser on Rooms
  total++;
  try {
    const tempRooms = path.join(os.tmpdir(), `temp_rooms_${Date.now()}.csv`);
    fs.writeFileSync(tempRooms, 'room_number,building,capacity,rows_count,cols_count\nE2-101,Block E,30,5,6\nE2-102,Block E,30,5,6\nE2-201,Block E,40,5,8\nAUD-HALL,Main Block,80,8,10');
    const { validRows, errorRows } = await parseAndValidateCSV(tempRooms, 'rooms');
    try { fs.unlinkSync(tempRooms); } catch {}

    if (validRows.length === 4 && errorRows.length === 0) {
      console.log(` [TEST 4 PASSED] Rooms CSV parsed correctly (${validRows.length} valid rooms found).`);
      passed++;
    } else {
      console.error(`❌ [TEST 4 FAILED] Unexpected room count: ${validRows.length}`);
    }
  } catch (err) {
    console.error('❌ [TEST 4 FAILED]', err.message);
  }

  // Test 5: CSV Validation on Courses
  total++;
  try {
    const tempCourses = path.join(os.tmpdir(), `temp_courses_${Date.now()}.csv`);
    fs.writeFileSync(tempCourses, 'course_code,course_name,department,semester,difficulty_level\nCSE3005,Software Engineering,CSE,4,3\nCSE3002,Database Management Systems,CSE,4,4\nECE2001,Digital Electronics,ECE,4,4\nME1001,Thermodynamics,ME,4,5');
    const { validRows } = await parseAndValidateCSV(tempCourses, 'courses');
    try { fs.unlinkSync(tempCourses); } catch {}

    if (validRows.length === 4) {
      console.log(' [TEST 5 PASSED] Courses CSV validation and data mapping verified.');
      passed++;
    } else {
      console.error('❌ [TEST 5 FAILED] Courses CSV failed validation.');
    }
  } catch (err) {
    console.error('❌ [TEST 5 FAILED]', err.message);
  }

  console.log('\n======================================================');
  console.log(`🎯 RESULT: ${passed} / ${total} TESTS PASSED`);
  console.log('======================================================\n');
}

runTests();
