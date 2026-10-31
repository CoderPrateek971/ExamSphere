const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function migrate() {
  console.log('\n======================================================');
  console.log('🔄 Running ExamSphere Database Schema Migration...');
  console.log('======================================================\n');

  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'examsphere_db',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      multipleStatements: true
    });

    console.log(' Connected to MySQL database:', process.env.DB_NAME || 'examsphere_db');

    // Helper to check if column exists
    async function columnExists(table, column) {
      const [rows] = await connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
      );
      return rows.length > 0;
    }

    // Helper to check if table exists
    async function tableExists(table) {
      const [rows] = await connection.query(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
        [table]
      );
      return rows.length > 0;
    }

    // Helper to add column if missing
    async function addColumnIfMissing(table, column, definition) {
      const exists = await columnExists(table, column);
      if (!exists) {
        console.log(`  ➕ Adding column [${column}] to table [${table}]...`);
        await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
      }
    }

    // 1. users
    await addColumnIfMissing('users', 'phone_number', 'VARCHAR(20) NULL AFTER role');
    await addColumnIfMissing('users', 'is_active', 'BOOLEAN DEFAULT TRUE AFTER phone_number');

    // 2. courses
    await addColumnIfMissing('courses', 'eligible_branches', "VARCHAR(255) DEFAULT 'CSE' AFTER department");
    await addColumnIfMissing('courses', 'credits', 'DECIMAL(3,1) DEFAULT 3.0 AFTER eligible_branches');
    await addColumnIfMissing('courses', 'target_batch', 'VARCHAR(20) NULL AFTER semester');
    await addColumnIfMissing('courses', 'is_multidisciplinary', 'BOOLEAN DEFAULT FALSE AFTER difficulty_level');
    await addColumnIfMissing('courses', 'is_lab_course', 'BOOLEAN DEFAULT FALSE AFTER is_multidisciplinary');
    await addColumnIfMissing('courses', 'course_coordinator_name', 'VARCHAR(120) NULL AFTER is_lab_course');
    await addColumnIfMissing('courses', 'course_coordinator_id', 'INT NULL AFTER course_coordinator_name');
    await addColumnIfMissing('courses', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

    // 3. course_section_instructors table
    if (!(await tableExists('course_section_instructors'))) {
      console.log('  ➕ Creating table [course_section_instructors]...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS course_section_instructors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            course_id INT NOT NULL,
            section_name VARCHAR(50) NOT NULL,
            instructor_name VARCHAR(120) NOT NULL,
            instructor_id INT NULL,
            lecture_or_lab ENUM('LECTURE', 'LAB', 'BOTH') DEFAULT 'LECTURE',
            academic_year VARCHAR(20) DEFAULT '2025-2026',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_course_section (course_id, section_name, academic_year),
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
        )
      `);
    }

    // 4. students
    await addColumnIfMissing('students', 'unique_id', 'VARCHAR(50) NULL AFTER enrollment_no');
    await addColumnIfMissing('students', 'stream_section', 'VARCHAR(50) NULL AFTER department');
    await addColumnIfMissing('students', 'batch_year', "VARCHAR(20) DEFAULT '2025' AFTER stream_section");
    await addColumnIfMissing('students', 'is_repeat_student', 'BOOLEAN DEFAULT FALSE AFTER program');

    // 5. faculty
    await addColumnIfMissing('faculty', 'contact_number', 'VARCHAR(30) NULL AFTER email');
    await addColumnIfMissing('faculty', 'school', "VARCHAR(50) DEFAULT 'SOET' AFTER department");
    await addColumnIfMissing('faculty', 'staff_category', "ENUM('FACULTY', 'PHD_SCHOLAR', 'LAB_STAFF', 'EXTERNAL') NOT NULL DEFAULT 'FACULTY' AFTER designation");
    await addColumnIfMissing('faculty', 'assigned_duties_count', 'INT DEFAULT 0 AFTER max_duties');
    await addColumnIfMissing('faculty', 'availability_notes', 'TEXT NULL AFTER assigned_duties_count');
    await addColumnIfMissing('faculty', 'is_available', 'BOOLEAN DEFAULT TRUE AFTER availability_notes');

    // 6. rooms
    await addColumnIfMissing('rooms', 'special_instructions', 'TEXT NULL AFTER is_available');

    // 7. room_constraints table
    if (!(await tableExists('room_constraints'))) {
      console.log('  ➕ Creating table [room_constraints]...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS room_constraints (
            id INT AUTO_INCREMENT PRIMARY KEY,
            room_id INT NOT NULL,
            blackout_date DATE NOT NULL,
            shift ENUM('ALL', 'MORNING', 'AFTERNOON', 'EVENING') DEFAULT 'ALL',
            reason VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
        )
      `);
    }

    // 8. exams
    await addColumnIfMissing('exams', 'target_batch', 'VARCHAR(30) NULL AFTER exam_type');
    await addColumnIfMissing('exams', 'academic_session', "VARCHAR(50) DEFAULT 'MID_TERM_MARCH_2026' AFTER target_batch");
    await addColumnIfMissing('exams', 'shift', "ENUM('MORNING', 'AFTERNOON', 'EVENING', 'FULL_DAY') NOT NULL DEFAULT 'MORNING' AFTER exam_date");
    await addColumnIfMissing('exams', 'reporting_time', "TIME DEFAULT '09:30:00' AFTER shift");
    await addColumnIfMissing('exams', 'registered_students_count', 'INT DEFAULT 0 AFTER duration_minutes');
    await addColumnIfMissing('exams', 'required_rooms_count', 'INT DEFAULT 1 AFTER registered_students_count');
    await addColumnIfMissing('exams', 'seating_plan_status', "ENUM('PENDING', 'GENERATED', 'VERIFIED', 'PUBLISHED') DEFAULT 'PENDING' AFTER required_rooms_count");
    await addColumnIfMissing('exams', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

    // 9. seat_allocations
    await addColumnIfMissing('seat_allocations', 'desk_label', 'VARCHAR(30) NULL AFTER seat_number');

    // 10. invigilation_duties
    await addColumnIfMissing('invigilation_duties', 'duty_role', "ENUM('CHIEF_INVIGILATOR', 'ASSISTANT_INVIGILATOR', 'LAB_SUPPORT', 'RELIEVER', 'OBSERVER') DEFAULT 'ASSISTANT_INVIGILATOR' AFTER faculty_id");
    await addColumnIfMissing('invigilation_duties', 'is_own_exam', 'BOOLEAN DEFAULT FALSE AFTER substitute_faculty_id');
    await addColumnIfMissing('invigilation_duties', 'reporting_confirmed_at', 'TIMESTAMP NULL AFTER is_own_exam');
    await addColumnIfMissing('invigilation_duties', 'signature_confirmed', 'BOOLEAN DEFAULT FALSE AFTER reporting_confirmed_at');
    await addColumnIfMissing('invigilation_duties', 'remarks', 'VARCHAR(255) NULL AFTER signature_confirmed');

    // 11. attendance
    await addColumnIfMissing('attendance', 'answer_booklet_no', 'VARCHAR(50) NULL AFTER status');
    await addColumnIfMissing('attendance', 'supp_sheets_issued', 'INT DEFAULT 0 AFTER answer_booklet_no');
    await addColumnIfMissing('attendance', 'supp_sheet_numbers', 'VARCHAR(255) NULL AFTER supp_sheets_issued');
    await addColumnIfMissing('attendance', 'student_signature_verified', 'BOOLEAN DEFAULT FALSE AFTER photo_path');
    await addColumnIfMissing('attendance', 'marked_by_invigilator_id', 'INT NULL AFTER marked_at');

    // 12. stationery_records table
    if (!(await tableExists('stationery_records'))) {
      console.log('  ➕ Creating table [stationery_records]...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS stationery_records (
            id INT AUTO_INCREMENT PRIMARY KEY,
            exam_id INT NOT NULL,
            room_id INT NOT NULL,
            shift ENUM('MORNING', 'AFTERNOON', 'EVENING') NOT NULL DEFAULT 'MORNING',
            main_booklets_issued INT NOT NULL DEFAULT 32,
            supp_sheets_issued INT NOT NULL DEFAULT 50,
            main_booklets_used INT NOT NULL DEFAULT 0,
            supp_sheets_used INT NOT NULL DEFAULT 0,
            main_booklets_unused INT NOT NULL DEFAULT 0,
            supp_sheets_unused INT NOT NULL DEFAULT 0,
            issuing_officer_name VARCHAR(100) DEFAULT 'Exam Control Room',
            receiving_invigilator_id INT NULL,
            returned_at TIMESTAMP NULL,
            status ENUM('ISSUED', 'RETURNED', 'VERIFIED', 'DISCREPANCY') DEFAULT 'ISSUED',
            remarks TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_exam_room_stationery (exam_id, room_id),
            FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
            FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
            FOREIGN KEY (receiving_invigilator_id) REFERENCES faculty(id) ON DELETE SET NULL
        )
      `);
    }

    // 13. question_paper_logistics table
    if (!(await tableExists('question_paper_logistics'))) {
      console.log('  ➕ Creating table [question_paper_logistics]...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS question_paper_logistics (
            id INT AUTO_INCREMENT PRIMARY KEY,
            course_id INT NOT NULL,
            exam_id INT NULL,
            coordinator_name VARCHAR(120) NOT NULL,
            coordinator_id INT NULL,
            required_qp_count INT NOT NULL DEFAULT 0,
            receiving_status ENUM('PENDING', 'RECEIVED', 'PRINTED', 'PACKED', 'DISPATCHED') DEFAULT 'PENDING',
            is_received BOOLEAN DEFAULT FALSE,
            submission_date DATE NULL,
            answer_sheets_received BOOLEAN DEFAULT FALSE,
            remarks VARCHAR(255) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
            FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE SET NULL,
            FOREIGN KEY (coordinator_id) REFERENCES faculty(id) ON DELETE SET NULL
        )
      `);
    }

    // 14. exam_scheduling_discussions table
    if (!(await tableExists('exam_scheduling_discussions'))) {
      console.log('  ➕ Creating table [exam_scheduling_discussions]...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS exam_scheduling_discussions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            discussion_topic VARCHAR(255) NOT NULL,
            query_text TEXT NOT NULL,
            resolution_text TEXT NOT NULL,
            status ENUM('OPEN', 'RESOLVED', 'IMPLEMENTED') DEFAULT 'IMPLEMENTED',
            affected_batch VARCHAR(50) NULL,
            action_taken TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // 15. ufm_reports
    await addColumnIfMissing('ufm_reports', 'report_number', 'VARCHAR(50) NULL AFTER id');
    await addColumnIfMissing('ufm_reports', 'exam_name', 'VARCHAR(150) NULL AFTER exam_id');
    await addColumnIfMissing('ufm_reports', 'course_code', 'VARCHAR(50) NULL AFTER exam_name');
    await addColumnIfMissing('ufm_reports', 'student_name', "VARCHAR(120) NOT NULL DEFAULT 'Unknown' AFTER student_id");
    await addColumnIfMissing('ufm_reports', 'student_roll', "VARCHAR(50) NOT NULL DEFAULT 'Unknown' AFTER student_name");
    await addColumnIfMissing('ufm_reports', 'student_dept', 'VARCHAR(100) NULL AFTER student_roll');
    await addColumnIfMissing('ufm_reports', 'room_number', "VARCHAR(50) NOT NULL DEFAULT 'Unknown' AFTER room_id");
    await addColumnIfMissing('ufm_reports', 'desk_number', 'VARCHAR(50) NULL AFTER room_number');
    await addColumnIfMissing('ufm_reports', 'invigilator_name', "VARCHAR(120) NOT NULL DEFAULT 'Unknown' AFTER invigilator_id");
    await addColumnIfMissing('ufm_reports', 'invigilator_department', 'VARCHAR(100) NULL AFTER invigilator_name');
    await addColumnIfMissing('ufm_reports', 'incident_date', 'DATE NULL AFTER invigilator_department');
    await addColumnIfMissing('ufm_reports', 'incident_time', 'VARCHAR(20) NULL AFTER incident_date');
    await addColumnIfMissing('ufm_reports', 'incident_type', "ENUM('UNAUTHORIZED_NOTES', 'MOBILE_DEVICE', 'SMARTWATCH_DEVICE', 'COPYING_NEIGHBOR', 'IMPERSONATION', 'COMMUNICATION', 'OTHER') NOT NULL DEFAULT 'OTHER' AFTER incident_time");
    await addColumnIfMissing('ufm_reports', 'severity', "ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM' AFTER incident_type");
    await addColumnIfMissing('ufm_reports', 'material_confiscated', "TEXT NULL AFTER severity");
    await addColumnIfMissing('ufm_reports', 'witness_name', 'VARCHAR(120) NULL AFTER student_statement');
    await addColumnIfMissing('ufm_reports', 'committee_remarks', 'TEXT NULL AFTER status');
    await addColumnIfMissing('ufm_reports', 'penalty_imposed', 'VARCHAR(255) NULL AFTER committee_remarks');
    await addColumnIfMissing('ufm_reports', 'resolved_by', 'VARCHAR(120) NULL AFTER penalty_imposed');
    await addColumnIfMissing('ufm_reports', 'resolved_at', 'TIMESTAMP NULL AFTER resolved_by');

    console.log('\n✅ Database schema successfully migrated to the latest blueprint!');
    console.log('All missing columns & tables have been synchronized without data loss.\n');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
