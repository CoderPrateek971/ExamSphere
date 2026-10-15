const fs = require('fs');
const { query } = require('../config/db');
const { parseAndValidateCSV } = require('../utils/csvParser');

/**
 * Strategy Pattern: Entity Ingestion Strategies
 * Extensible for any new entity without altering the core ingestion algorithm (Open-Closed Principle)
 */
const INGESTION_STRATEGIES = {
  students: async (rows) => {
    let count = 0;
    for (const row of rows) {
      await query(
        `INSERT INTO students (enrollment_no, name, email, department, semester, program)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), department = VALUES(department), semester = VALUES(semester)`,
        [row.enrollment_no, row.name, row.email, row.department, parseInt(row.semester, 10) || 1, row.program || 'B.Tech']
      );
      count++;
    }
    return count;
  },

  faculty: async (rows) => {
    let count = 0;
    for (const row of rows) {
      await query(
        `INSERT INTO faculty (faculty_code, name, email, department, designation, seniority_level, max_duties)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), department = VALUES(department), designation = VALUES(designation)`,
        [row.faculty_code, row.name, row.email, row.department, row.designation || 'Assistant Professor', parseInt(row.seniority_level, 10) || 1, parseInt(row.max_duties, 10) || 5]
      );
      count++;
    }
    return count;
  },

  courses: async (rows) => {
    let count = 0;
    for (const row of rows) {
      await query(
        `INSERT INTO courses (course_code, course_name, department, semester, difficulty_level)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE course_name = VALUES(course_name), department = VALUES(department), difficulty_level = VALUES(difficulty_level)`,
        [row.course_code, row.course_name, row.department, parseInt(row.semester, 10) || 1, parseInt(row.difficulty_level, 10) || 3]
      );
      count++;
    }
    return count;
  },

  rooms: async (rows) => {
    let count = 0;
    for (const row of rows) {
      const capacity = parseInt(row.capacity, 10) || 30;
      const rowsCount = parseInt(row.rows_count, 10) || 5;
      const colsCount = parseInt(row.cols_count, 10) || Math.ceil(capacity / rowsCount);
      await query(
        `INSERT INTO rooms (room_number, building, floor, capacity, rows_count, cols_count)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE building = VALUES(building), capacity = VALUES(capacity)`,
        [row.room_number, row.building, parseInt(row.floor, 10) || 1, capacity, rowsCount, colsCount]
      );
      count++;
    }
    return count;
  }
};

class CSVIngestionService {
  /**
   * Process and ingest CSV for any supported entity type
   */
  async ingestCSV(filePath, entityType) {
    const strategy = INGESTION_STRATEGIES[entityType];
    if (!strategy) {
      throw new Error(`Unsupported entity type: ${entityType}`);
    }

    try {
      const { validRows, errorRows } = await parseAndValidateCSV(filePath, entityType);
      const insertedCount = await strategy(validRows);

      return {
        totalRowsProcessed: validRows.length + errorRows.length,
        insertedOrUpdated: insertedCount,
        failedRowsCount: errorRows.length,
        errors: errorRows
      };
    } finally {
      // Always cleanup file (Defensive Resource Management)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
}

module.exports = new CSVIngestionService();
