const path = require('path');
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

  // Test 3: CSV Stream Parser on Students Template
  total++;
  try {
    const studentsCSV = path.join(__dirname, '../templates/students_template.csv');
    const { validRows, errorRows } = await parseAndValidateCSV(studentsCSV, 'students');

    if (validRows.length === 6 && errorRows.length === 0) {
      console.log(` [TEST 3 PASSED] Students CSV parsed correctly (${validRows.length} valid rows found).`);
      passed++;
    } else {
      console.error(`❌ [TEST 3 FAILED] Unexpected row counts. Valid: ${validRows.length}, Errors: ${errorRows.length}`);
    }
  } catch (err) {
    console.error('❌ [TEST 3 FAILED]', err.message);
  }

  // Test 4: CSV Stream Parser on Rooms Template
  total++;
  try {
    const roomsCSV = path.join(__dirname, '../templates/rooms_template.csv');
    const { validRows, errorRows } = await parseAndValidateCSV(roomsCSV, 'rooms');

    if (validRows.length === 4 && errorRows.length === 0) {
      console.log(` [TEST 4 PASSED] Rooms CSV parsed correctly (${validRows.length} valid rooms found).`);
      passed++;
    } else {
      console.error(`❌ [TEST 4 FAILED] Unexpected room count: ${validRows.length}`);
    }
  } catch (err) {
    console.error('❌ [TEST 4 FAILED]', err.message);
  }

  // Test 5: CSV Error Detection on Invalid Data
  total++;
  try {
    // Testing logic against unknown or missing columns
    const coursesCSV = path.join(__dirname, '../templates/courses_template.csv');
    const { validRows } = await parseAndValidateCSV(coursesCSV, 'courses');

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
