const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const authService = require('../services/authService');
const { parseAndValidateCSV } = require('../utils/csvParser');

async function testRequirements() {
  console.log('======================================================');
  console.log('🧪 TESTING USER REQUIREMENTS 1 & 2');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  // ---------------- REQUIREMENT 1 ----------------
  // During login, when both fields are empty, display the message as "Email and password are required".
  total++;
  try {
    await authService.loginUser({ email: '', password: '' });
    assert.fail('Should have failed on empty credentials');
  } catch (err) {
    assert.strictEqual(err.statusCode, 400);
    assert.strictEqual(err.message, 'Email and password are required');
    console.log('✅ [REQ 1 PASSED] Empty email & password throws "Email and password are required"');
    passed++;
  }

  total++;
  try {
    await authService.loginUser({ email: '   ', password: '   ' });
    assert.fail('Should have failed on whitespace-only credentials');
  } catch (err) {
    assert.strictEqual(err.statusCode, 400);
    assert.strictEqual(err.message, 'Email and password are required');
    console.log('✅ [REQ 1 PASSED] Whitespace email & password throws "Email and password are required"');
    passed++;
  }

  // ---------------- REQUIREMENT 2 ----------------
  // When uploading the csv file, it should also let me choose pdf or png from my laptop
  // but after uploading it should display "Only CSV files are allowed".
  total++;
  const tempPdf = path.join(os.tmpdir(), `test_sample_${Date.now()}.pdf`);
  fs.writeFileSync(tempPdf, '%PDF-1.4 dummy pdf content');
  try {
    await parseAndValidateCSV(tempPdf, 'students');
    assert.fail('Should have rejected PDF file');
  } catch (err) {
    assert.strictEqual(err.message, 'Only CSV files are allowed');
    console.log('✅ [REQ 2 PASSED] Uploading PDF file displays "Only CSV files are allowed"');
    passed++;
  } finally {
    try { fs.unlinkSync(tempPdf); } catch {}
  }

  total++;
  const tempPng = path.join(os.tmpdir(), `test_sample_${Date.now()}.png`);
  fs.writeFileSync(tempPng, '\x89PNG\r\n\x1a\n dummy png content');
  try {
    await parseAndValidateCSV(tempPng, 'students');
    assert.fail('Should have rejected PNG file');
  } catch (err) {
    assert.strictEqual(err.message, 'Only CSV files are allowed');
    console.log('✅ [REQ 2 PASSED] Uploading PNG file displays "Only CSV files are allowed"');
    passed++;
  } finally {
    try { fs.unlinkSync(tempPng); } catch {}
  }

  // Verify valid CSV still works
  total++;
  const tempCsv = path.join(os.tmpdir(), `test_sample_${Date.now()}.csv`);
  fs.writeFileSync(tempCsv, 'enrollment_no,name,email,department,semester,program,enrolled_courses\n240101,Aarav Sharma,aarav@bmu.edu.in,CSE,4,B.Tech,CSE3005');
  try {
    const { validRows } = await parseAndValidateCSV(tempCsv, 'students');
    assert.strictEqual(validRows.length, 1);
    console.log('✅ [REQ 2 PASSED] Valid CSV file continues to parse and succeed cleanly');
    passed++;
  } catch (err) {
    assert.fail('Valid CSV should not fail: ' + err.message);
  } finally {
    try { fs.unlinkSync(tempCsv); } catch {}
  }

  console.log('\n======================================================');
  console.log(`🎯 RESULT: ${passed} / ${total} TESTS PASSED`);
  console.log('======================================================\n');
}

testRequirements();

