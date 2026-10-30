const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const assert = require('assert');
const { parseAndValidateCSV } = require('../utils/csvParser');

async function runXLSXTests() {
  console.log('\n======================================================');
  console.log('🧪 TESTING EXCEL (.XLSX) INGESTION SUPPORT');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;
  const tempXLSX = path.join(__dirname, '../uploads/test_students.xlsx');

  try {
    // 1. Create a demo .xlsx file
    const sampleData = [
      { enrollment_no: '240501', name: 'Kabir Sharma', email: 'kabir.s@bmu.edu.in', department: 'CSE' },
      { enrollment_no: '240502', name: 'Riya Verma', email: 'riya.v@bmu.edu.in', department: 'ECE' },
      { enrollment_no: '240503', name: 'Dev Patel', email: 'dev.p@bmu.edu.in', department: 'ME' }
    ];

    const worksheet = xlsx.utils.json_to_sheet(sampleData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Students');
    xlsx.writeFile(workbook, tempXLSX);

    // Test 1: Parse and validate .xlsx file
    total++;
    const { validRows, errorRows } = await parseAndValidateCSV(tempXLSX, 'students');

    assert.strictEqual(validRows.length, 3, 'Should parse 3 valid rows from XLSX');
    assert.strictEqual(errorRows.length, 0, 'Should have 0 errors for complete XLSX');
    assert.strictEqual(validRows[0].enrollment_no, '240501');
    assert.strictEqual(validRows[0].name, 'Kabir Sharma');

    console.log(`✅ [TEST 1 PASSED] Successfully parsed Excel .xlsx file with ${validRows.length} valid student rows.`);
    passed++;

    // Test 2: XLSX with missing required field
    total++;
    const invalidData = [
      { enrollment_no: '', name: 'Missing Roll Student', email: 'test@bmu.edu.in', department: 'CSE' }
    ];
    const invalidWS = xlsx.utils.json_to_sheet(invalidData);
    const invalidWB = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(invalidWB, invalidWS, 'Students');
    const tempInvalidXLSX = path.join(__dirname, '../uploads/test_invalid.xlsx');
    xlsx.writeFile(invalidWB, tempInvalidXLSX);

    const invalidRes = await parseAndValidateCSV(tempInvalidXLSX, 'students');
    assert.strictEqual(invalidRes.errorRows.length, 1, 'Should flag missing enrollment_no in XLSX');
    assert(invalidRes.errorRows[0].error.includes('Missing required field(s): enrollment_no'));

    console.log(`✅ [TEST 2 PASSED] Successfully flagged missing required field in Excel .xlsx file.`);
    passed++;

    if (fs.existsSync(tempInvalidXLSX)) fs.unlinkSync(tempInvalidXLSX);

  } catch (err) {
    console.error('❌ XLSX Test Failed:', err);
  } finally {
    if (fs.existsSync(tempXLSX)) fs.unlinkSync(tempXLSX);
    console.log('\n======================================================');
    console.log(`🎯 RESULT: ${passed} / ${total} TESTS PASSED`);
    console.log('======================================================\n');
  }
}

runXLSXTests();
