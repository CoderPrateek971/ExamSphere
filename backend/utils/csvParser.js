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
 * Parse and validate an Excel (.xlsx / .xls) file
 */
function parseXLSX(filePath, requiredFields) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { validRows: [], errorRows: [] };
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  const validRows = [];
  const errorRows = [];
  let rowIndex = 1;

  for (const rawRow of rawRows) {
    rowIndex++;
    const row = {};
    for (const [key, val] of Object.entries(rawRow)) {
      row[key.trim().toLowerCase()] = typeof val === 'string' ? val.trim() : String(val).trim();
    }

    // Support enrolled_subjects / enrolled_courses alias
    if (row.enrolled_subjects && !row.enrolled_courses) row.enrolled_courses = row.enrolled_subjects;
    if (row.enrolled_courses && !row.enrolled_subjects) row.enrolled_subjects = row.enrolled_courses;

    // Validate required columns
    const missingFields = requiredFields.filter((field) => !row[field] || row[field] === '');
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
      return reject(new Error(`Unknown entity type: ${entityType}`));
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

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (rawRow) => {
        rowIndex++;
        // Clean column keys and trim values
        const row = {};
        for (const [key, val] of Object.entries(rawRow)) {
          row[key.trim().toLowerCase()] = typeof val === 'string' ? val.trim() : val;
        }

        // Support enrolled_subjects / enrolled_courses alias
        if (row.enrolled_subjects && !row.enrolled_courses) row.enrolled_courses = row.enrolled_subjects;
        if (row.enrolled_courses && !row.enrolled_subjects) row.enrolled_subjects = row.enrolled_courses;

        // Validate required columns
        const missingFields = requiredFields.filter((field) => !row[field] || row[field] === '');
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
        resolve({ validRows, errorRows });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

module.exports = {
  parseAndValidateCSV,
  REQUIRED_SCHEMAS
};
