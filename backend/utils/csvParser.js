const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Canonical field name synonyms for smart column normalization
const COLUMN_SYNONYMS = {
  // Courses
  course_code: ['course_code', 'course code', 'code', 'sub_code', 'subject_code', 'course_no', 'coursecode'],
  course_name: ['course_name', 'course', 'course title', 'subject', 'subject_name', 'subject title', 'title', 'coursename'],
  department: ['department', 'dept', 'branch', 'stream', 'school', 'discipline'],
  credits: ['credits', 'credit', 'cr'],
  course_coordinator_name: ['course_coordinator', 'course coordinator', 'coordinator', 'coordinator_name', 'faculty coordinator'],
  target_batch: ['target_batch', 'batch', 'year', 'batch_year', 'academic_year'],

  // Rooms
  room_number: ['room_number', 'room no', 'room no.', 'room', 'room_no', 'hall', 'room number', 'venue'],
  building: ['building', 'block', 'bldg', 'wing'],
  capacity: ['capacity', 'seating capacity', 'seating_capacity', 'seats', 'strength', 'no. of students', 'no. of rooms required'],
  special_instructions: ['special_instructions', 'instructions', 'notes', 'remarks', 'comments'],

  // Faculty
  faculty_code: ['faculty_code', 'faculty code', 'code', 'emp_id', 'employee_id', 'id'],
  name: ['name', 'faculty_name', 'faculty name', 'student_name', 'student name', 'full_name', 'full name', 'invigilator', 'invigilators'],
  email: ['email', 'email_id', 'mail', 'email address'],
  contact_number: ['contact', 'contact_number', 'phone', 'mobile', 'contact no', 'mobile no'],
  designation: ['designation', 'post', 'role', 'title'],
  staff_category: ['staff_category', 'category', 'type', 'staff type'],

  // Students
  enrollment_no: ['enrollment_no', 'enrollment no', 'enrollment', 'roll_no', 'roll no', 'roll_number', 'roll number'],
  unique_id: ['unique_id', 'unique id', 'uid', 'student_id'],
  stream_section: ['stream_section', 'section', 'stream / section', 'stream']
};

// Expected columns for each entity matching Resource & Data Management schemas
const REQUIRED_SCHEMAS = {
  students: ['enrollment_no', 'name', 'email', 'department', 'semester', 'program', 'enrolled_courses'],
  faculty: ['faculty_code', 'name', 'email', 'department', 'designation', 'max_duties'],
  courses: ['course_code', 'course_name', 'department', 'semester', 'difficulty_level'],
  rooms: ['room_number', 'building', 'capacity', 'rows_count', 'cols_count']
};

/**
 * Normalizes raw row object using synonym dictionary
 */
function normalizeRow(rawRow) {
  const normalized = {};
  const lowerKeyMap = {};

  for (const [key, val] of Object.entries(rawRow)) {
    const cleanKey = String(key).trim().toLowerCase();
    const cleanVal = typeof val === 'string' ? val.trim() : val;
    lowerKeyMap[cleanKey] = cleanVal;
  }

  // Map known canonical fields
  for (const [canonicalField, synonyms] of Object.entries(COLUMN_SYNONYMS)) {
    for (const syn of synonyms) {
      if (lowerKeyMap[syn] !== undefined && lowerKeyMap[syn] !== '') {
        normalized[canonicalField] = lowerKeyMap[syn];
        break;
      }
    }
  }

  // Preserve any unmapped properties with sanitized keys
  for (const [cleanKey, val] of Object.entries(lowerKeyMap)) {
    const slug = cleanKey.replace(/[^a-z0-9_]/g, '_');
    if (normalized[slug] === undefined) {
      normalized[slug] = val;
    }
  }

  return normalized;
}

/**
 * Robust extraction of data rows from a sheet with intelligent header row detection.
 * Handles Excel files with title banners, merged headers, or metadata in the top rows.
 */
function extractRowsFromWorksheet(worksheet, entityType) {
  if (!worksheet) return [];

  // Read as 2D array of rows
  const grid = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  if (!grid || grid.length === 0) return [];

  const KEYWORDS_BY_TYPE = {
    courses: ['course code', 'course_code', 'course', 'subject', 'sub_code', 'sub code'],
    rooms: ['room no', 'room_no', 'room', 'room_number', 'capacity', 'seating capacity'],
    faculty: ['faculty name', 'faculty_name', 'name', 'invigilator', 'teacher', 'email'],
    students: ['enrollment', 'enrollment no', 'roll no', 'roll_no', 'unique id', 'student name']
  };

  const targetKeywords = KEYWORDS_BY_TYPE[entityType] || ['name', 'code', 'room', 'id'];

  let headerRowIndex = 0;
  let maxMatchCount = 0;

  // Scan top 25 rows to identify the actual column header row
  for (let r = 0; r < Math.min(grid.length, 25); r++) {
    const rowCells = grid[r].map(c => String(c).trim().toLowerCase());
    const matchCount = targetKeywords.filter(kw => rowCells.some(cell => cell.includes(kw))).length;
    if (matchCount > maxMatchCount) {
      maxMatchCount = matchCount;
      headerRowIndex = r;
    }
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

  // Otherwise, scan all sheets in the workbook and return the sheet with the most valid matches
  for (const sheetName of workbook.SheetNames) {
    const sheetRows = extractRowsFromWorksheet(workbook.Sheets[sheetName], targetEntityType);
    if (sheetRows.length > candidateRows.length) {
      candidateRows = sheetRows;
    }
  }

  return candidateRows;
}

/**
 * Parse and validate a spreadsheet (.xlsx, .xls, or .csv)
 */
async function parseAndValidateSpreadsheet(filePath, entityType) {
  if (entityType === 'master-sheet') {
    const workbook = XLSX.readFile(filePath, { cellDates: true });
    return { validRows: [], errorRows: [], workbook };
  }

  const requiredFields = REQUIRED_SCHEMAS[entityType] || [];
  const rawRows = readSpreadsheetRows(filePath, entityType);

  const validRows = [];
  const errorRows = [];

  rawRows.forEach((rawRow, idx) => {
    const rowNumber = idx + 2;
    const row = normalizeRow(rawRow);

    // Apply smart field inference if optional fields are missing
    if (entityType === 'courses') {
      if (!row.course_code && row.code) row.course_code = row.code;
      if (!row.course_name && row.course) row.course_name = row.course;
      if (!row.department && row.eligible_branches) row.department = row.eligible_branches.split(',')[0].trim();
      if (!row.department && row.branch) row.department = row.branch.split(',')[0].trim();
      if (!row.department) row.department = 'CSE';
      if (!row.credits && row.credit) row.credits = row.credit;
    }

    if (entityType === 'rooms') {
      if (!row.building) {
        const match = String(row.room_number || '').match(/^([A-Za-z]+)/);
        row.building = match ? match[1].toUpperCase() : 'Main Block';
      }
      if (!row.capacity) {
        row.capacity = 30; // standard default
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
    } else {
      validRows.push(row);
    }
  });

  return { validRows, errorRows };
}

// Backwards-compatible alias
const parseAndValidateCSV = parseAndValidateSpreadsheet;

module.exports = {
  parseAndValidateSpreadsheet,
  parseAndValidateCSV,
  readSpreadsheetRows,
  extractRowsFromWorksheet,
  normalizeRow,
  REQUIRED_SCHEMAS,
  COLUMN_SYNONYMS
};
