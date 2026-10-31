const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const xlsx = require('xlsx');

// Expected columns for each entity matching Resource & Data Management schemas
const REQUIRED_SCHEMAS = {
  students: ['enrollment_no', 'name', 'email', 'department', 'semester', 'program', 'enrolled_courses'],
  faculty: ['faculty_code', 'name', 'email', 'department', 'designation', 'max_duties'],
  courses: ['course_code', 'course_name', 'department', 'semester', 'difficulty_level'],
  rooms: ['room_number', 'building', 'capacity', 'rows_count', 'cols_count']
};

/**
 * Normalizes a key: strips UTF-8 BOM, trims whitespace, lowercases
 */
function cleanKey(k) {
  return String(k || '').replace(/^\uFEFF/, '').trim().toLowerCase();
}

/**
 * Normalizes a row object: cleans keys, maps synonyms like enrolled_subjects -> enrolled_courses
 */
function normalizeRow(rawRow) {
  const row = {};
  for (const [key, val] of Object.entries(rawRow || {})) {
    const k = cleanKey(key);
    row[k] = typeof val === 'string' ? val.trim() : (val !== undefined && val !== null ? String(val).trim() : '');
  }

  // Alias support for enrolled_subjects <-> enrolled_courses
  if (row.enrolled_subjects && !row.enrolled_courses) row.enrolled_courses = row.enrolled_subjects;
  if (row.enrolled_courses && !row.enrolled_subjects) row.enrolled_subjects = row.enrolled_courses;

  return row;
}

/**
 * Parse semester from various formats (e.g. 4, "Sem 4", "4th")
 */
function parseSemester(val) {
  if (val === undefined || val === null || val === '') return 1;
  const num = parseInt(String(val).match(/\d+/)?.[0], 10);
  return !isNaN(num) && num >= 1 && num <= 8 ? num : 1;
}

/**
 * Parse and validate an Excel (.xlsx / .xls) file
 */
function parseXLSX(filePath, requiredFields) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    const err = new Error('The uploaded Excel spreadsheet contains no worksheets.');
    err.statusCode = 400;
    throw err;
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
  if (rawRows.length === 0) {
    const err = new Error('The uploaded file contains no data rows.');
    err.statusCode = 400;
    throw err;
  }

  // 1. Validate required columns exist in headers
  const firstRow = rawRows[0];
  const fileHeaders = Object.keys(firstRow).map(cleanKey);
  if (fileHeaders.includes('enrolled_subjects') && !fileHeaders.includes('enrolled_courses')) {
    fileHeaders.push('enrolled_courses');
  }

  const missingColumns = requiredFields.filter((field) => !fileHeaders.includes(field));
  if (missingColumns.length > 0) {
    const err = new Error(`Missing required field(s): ${missingColumns.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  // 2. Validate data rows
  const validRows = [];
  const errorRows = [];
  let rowIndex = 1;

  for (const rawRow of rawRows) {
    rowIndex++;
    const row = normalizeRow(rawRow);

    const missingFields = requiredFields.filter((field) => row[field] === undefined || row[field] === null || String(row[field]).trim() === '');
    if (missingFields.length > 0) {
      errorRows.push({
        rowNumber: rowIndex,
        data: row,
        error: `Missing required field(s): ${missingFields.join(', ')}`
      });
    } else {
      validRows.push(row);
    }
  }

  return { validRows, errorRows };
}

/**
 * Parse and validate a CSV or Excel (.xlsx) file
 * @param {string} filePath 
 * @param {'students' | 'faculty' | 'courses' | 'rooms'} entityType 
 * @returns {Promise<{ validRows: Array, errorRows: Array }>}
 */
function parseAndValidateCSV(filePath, entityType) {
  return new Promise((resolve, reject) => {
    const requiredFields = REQUIRED_SCHEMAS[entityType];
    if (!requiredFields) {
      const err = new Error(`Unknown entity type: ${entityType}`);
      err.statusCode = 400;
      return reject(err);
    }

    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
      try {
        const result = parseXLSX(filePath, requiredFields);
        return resolve(result);
      } catch (err) {
        return reject(err);
      }
    }

    const validRows = [];
    const errorRows = [];
    let rowIndex = 1; // 1-indexed, starting after header
    let headerError = null;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('headers', (headers) => {
        const cleanHeaders = headers.map(cleanKey);
        if (cleanHeaders.includes('enrolled_subjects') && !cleanHeaders.includes('enrolled_courses')) {
          cleanHeaders.push('enrolled_courses');
        }

        const missingColumns = requiredFields.filter((field) => !cleanHeaders.includes(field));
        if (missingColumns.length > 0) {
          headerError = new Error(`Missing required field(s): ${missingColumns.join(', ')}`);
          headerError.statusCode = 400;
        }
      })
      .on('data', (rawRow) => {
        if (headerError) return;
        rowIndex++;

        const row = normalizeRow(rawRow);

        const missingFields = requiredFields.filter((field) => row[field] === undefined || row[field] === null || String(row[field]).trim() === '');
        if (missingFields.length > 0) {
          errorRows.push({
            rowNumber: rowIndex,
            data: row,
            error: `Missing required field(s): ${missingFields.join(', ')}`
          });
        } else {
          validRows.push(row);
        }
      })
      .on('end', () => {
        if (headerError) {
          return reject(headerError);
        }
        resolve({ validRows, errorRows });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

module.exports = {
  parseAndValidateCSV,
  parseAndValidateSpreadsheet: parseAndValidateCSV,
  normalizeRow,
  parseSemester,
  REQUIRED_SCHEMAS
};
