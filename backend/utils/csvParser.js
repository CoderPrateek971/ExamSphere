const fs = require('fs');
const csv = require('csv-parser');

// Expected columns for each entity
const REQUIRED_SCHEMAS = {
  students: ['enrollment_no', 'name', 'email', 'department'],
  faculty: ['faculty_code', 'name', 'email', 'department'],
  courses: ['course_code', 'course_name', 'department'],
  rooms: ['room_number', 'building', 'capacity']
};

/**
 * Parse and validate a CSV file
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
