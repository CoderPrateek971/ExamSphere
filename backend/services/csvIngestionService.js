const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { query } = require('../config/db');
const { parseAndValidateSpreadsheet, normalizeRow } = require('../utils/csvParser');

/**
 * Strategy Pattern: Entity Ingestion Strategies
 * Supports both Excel (.xlsx, .xls) and CSV (.csv) formats with extended attributes.
 */
const INGESTION_STRATEGIES = {
  students: async (rows) => {
    let count = 0;
    for (const row of rows) {
      await query(
        `INSERT INTO students (enrollment_no, unique_id, name, email, department, stream_section, batch_year, semester, program)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
            unique_id = COALESCE(VALUES(unique_id), unique_id),
            name = VALUES(name), 
            email = VALUES(email), 
            department = VALUES(department), 
            stream_section = COALESCE(VALUES(stream_section), stream_section),
            semester = VALUES(semester)`,
        [
          row.enrollment_no,
          row.unique_id || null,
          row.name,
          row.email,
          row.department || 'CSE',
          row.stream_section || null,
          row.batch_year || '2025',
          parseInt(row.semester, 10) || 1,
          row.program || 'B.Tech'
        ]
      );
      count++;
    }
    return count;
  },

  faculty: async (rows) => {
    let count = 0;
    for (const row of rows) {
      const cat = row.staff_category || 
        (String(row.name || '').includes('(RS)') ? 'PHD_SCHOLAR' : 'FACULTY');

      await query(
        `INSERT INTO faculty (faculty_code, name, email, contact_number, department, designation, staff_category, seniority_level, max_duties)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
            name = VALUES(name), 
            email = VALUES(email), 
            contact_number = COALESCE(VALUES(contact_number), contact_number),
            department = VALUES(department), 
            designation = VALUES(designation),
            staff_category = VALUES(staff_category)`,
        [
          row.faculty_code,
          row.name,
          row.email,
          row.contact_number || null,
          row.department || 'SOET',
          row.designation || 'Assistant Professor',
          cat,
          parseInt(row.seniority_level, 10) || (cat === 'FACULTY' ? 2 : 1),
          parseInt(row.max_duties, 10) || 5
        ]
      );
      count++;
    }
    return count;
  },

  courses: async (rows) => {
    let count = 0;
    for (const row of rows) {
      await query(
        `INSERT INTO courses (course_code, course_name, department, eligible_branches, credits, target_batch, course_coordinator_name, difficulty_level)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
            course_name = VALUES(course_name), 
            department = VALUES(department), 
            eligible_branches = COALESCE(VALUES(eligible_branches), eligible_branches),
            credits = COALESCE(VALUES(credits), credits),
            target_batch = COALESCE(VALUES(target_batch), target_batch),
            course_coordinator_name = COALESCE(VALUES(course_coordinator_name), course_coordinator_name),
            difficulty_level = VALUES(difficulty_level)`,
        [
          row.course_code,
          row.course_name,
          row.department || 'CSE',
          row.eligible_branches || row.department || 'CSE',
          parseFloat(row.credits) || 3.0,
          row.target_batch || null,
          row.course_coordinator_name || null,
          parseInt(row.difficulty_level, 10) || 3
        ]
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
        `INSERT INTO rooms (room_number, building, floor, capacity, rows_count, cols_count, special_instructions)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
            building = VALUES(building), 
            capacity = VALUES(capacity),
            rows_count = VALUES(rows_count),
            cols_count = VALUES(cols_count),
            special_instructions = COALESCE(VALUES(special_instructions), special_instructions)`,
        [
          row.room_number,
          row.building || 'Main Block',
          parseInt(row.floor, 10) || 1,
          capacity,
          rowsCount,
          colsCount,
          row.special_instructions || null
        ]
      );
      count++;
    }
    return count;
  },

  'master-sheet': async (workbook) => {
    let totalIngested = 0;
    const summary = { courses: 0, rooms: 0, faculty: 0, students: 0 };

    for (const sheetName of workbook.SheetNames) {
      const sLower = sheetName.toLowerCase().trim();
      const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
      if (rawRows.length === 0) continue;

      const normalizedRows = rawRows.map(normalizeRow);

      if (sLower.includes('course') || sLower.includes('subject') || sLower.includes('timetable') || normalizedRows[0]?.course_code) {
        const valid = normalizedRows.filter(r => r.course_code && r.course_name);
        if (valid.length > 0) {
          const count = await INGESTION_STRATEGIES.courses(valid);
          summary.courses += count;
          totalIngested += count;
        }
      }

      if (sLower.includes('room') || sLower.includes('venue') || sLower.includes('seating') || normalizedRows[0]?.room_number) {
        const valid = normalizedRows.filter(r => r.room_number);
        if (valid.length > 0) {
          const count = await INGESTION_STRATEGIES.rooms(valid);
          summary.rooms += count;
          totalIngested += count;
        }
      }

      if (sLower.includes('faculty') || sLower.includes('teacher') || sLower.includes('invigilator') || sLower.includes('scholar') || normalizedRows[0]?.faculty_code) {
        const valid = normalizedRows.filter(r => r.name);
        if (valid.length > 0) {
          const count = await INGESTION_STRATEGIES.faculty(valid);
          summary.faculty += count;
          totalIngested += count;
        }
      }

      if (sLower.includes('student') || sLower.includes('attendance') || sLower.includes('candidate') || normalizedRows[0]?.enrollment_no) {
        const valid = normalizedRows.filter(r => r.enrollment_no && r.name);
        if (valid.length > 0) {
          const count = await INGESTION_STRATEGIES.students(valid);
          summary.students += count;
          totalIngested += count;
        }
      }
    }

    return { totalIngested, summary };
  }
};

class SpreadsheetIngestionService {
  /**
   * Ingest any supported spreadsheet file (.xlsx, .xls, .csv)
   */
  async ingestSpreadsheet(filePath, entityType) {
    const strategy = INGESTION_STRATEGIES[entityType];
    if (!strategy) {
      throw new Error(`Unsupported entity type: ${entityType}. Supported: students, faculty, courses, rooms, master-sheet.`);
    }

    try {
      if (entityType === 'master-sheet') {
        const workbook = XLSX.readFile(filePath, { cellDates: true });
        const { totalIngested, summary } = await strategy(workbook);

        return {
          totalRowsProcessed: totalIngested,
          insertedOrUpdated: totalIngested,
          failedRowsCount: 0,
          errors: [],
          sheetSummary: summary
        };
      }

      const { validRows, errorRows } = await parseAndValidateSpreadsheet(filePath, entityType);
      const insertedCount = await strategy(validRows);

      return {
        totalRowsProcessed: validRows.length + errorRows.length,
        insertedOrUpdated: insertedCount,
        failedRowsCount: errorRows.length,
        errors: errorRows
      };
    } finally {
      // Defensive file cleanup
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {
          // ignore
        }
      }
    }
  }

  // Backwards-compatible alias
  async ingestCSV(filePath, entityType) {
    return this.ingestSpreadsheet(filePath, entityType);
  }
}

module.exports = new SpreadsheetIngestionService();
