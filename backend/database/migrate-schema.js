const { query } = require('../config/db');

async function ensureColumn(table, column, definition) {
  const [rows] = await query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  if (rows.length === 0) {
    console.log(`Adding column ${table}.${column}...`);
    await query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
}

async function runMigration() {
  console.log('🔄 Verifying and synchronizing database schema columns...');

  // 1. Courses
  await ensureColumn('courses', 'eligible_branches', "VARCHAR(255) DEFAULT 'CSE'");
  await ensureColumn('courses', 'credits', 'DECIMAL(3,1) DEFAULT 3.0');
  await ensureColumn('courses', 'semester', 'INT DEFAULT 1');
  await ensureColumn('courses', 'target_batch', 'VARCHAR(20) NULL');
  await ensureColumn('courses', 'difficulty_level', 'INT DEFAULT 3');
  await ensureColumn('courses', 'is_multidisciplinary', 'BOOLEAN DEFAULT FALSE');
  await ensureColumn('courses', 'is_lab_course', 'BOOLEAN DEFAULT FALSE');
  await ensureColumn('courses', 'course_coordinator_name', 'VARCHAR(100) NULL');
  await ensureColumn('courses', 'course_coordinator_id', 'INT NULL');
  await ensureColumn('courses', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

  // 2. Rooms
  await ensureColumn('rooms', 'special_instructions', 'TEXT NULL');

  // 3. Faculty
  await ensureColumn('faculty', 'contact_number', 'VARCHAR(30) NULL');
  await ensureColumn('faculty', 'school', "VARCHAR(50) DEFAULT 'SOET'");
  await ensureColumn('faculty', 'staff_category', "ENUM('FACULTY', 'PHD_SCHOLAR', 'LAB_STAFF', 'EXTERNAL') NOT NULL DEFAULT 'FACULTY'");
  await ensureColumn('faculty', 'is_available', 'BOOLEAN DEFAULT TRUE');

  // 4. Students
  await ensureColumn('students', 'unique_id', 'VARCHAR(50) NULL');
  await ensureColumn('students', 'stream_section', 'VARCHAR(50) NULL');
  await ensureColumn('students', 'batch', 'VARCHAR(20) NULL');
  await ensureColumn('students', 'is_repeat_student', 'BOOLEAN DEFAULT FALSE');

  // 5. Exams
  await ensureColumn('exams', 'target_batch', 'VARCHAR(30) NULL');
  await ensureColumn('exams', 'academic_session', "VARCHAR(50) DEFAULT 'MID_TERM_MARCH_2026'");
  await ensureColumn('exams', 'shift', "ENUM('MORNING', 'AFTERNOON', 'EVENING', 'FULL_DAY') NOT NULL DEFAULT 'MORNING'");
  await ensureColumn('exams', 'reporting_time', "TIME DEFAULT '09:30:00'");
  await ensureColumn('exams', 'registered_students_count', 'INT DEFAULT 0');
  await ensureColumn('exams', 'required_rooms_count', 'INT DEFAULT 1');

  // 6. Ensure course_section_instructors table exists
  await query(`
    CREATE TABLE IF NOT EXISTS course_section_instructors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      course_id INT NOT NULL,
      section_name VARCHAR(50) NOT NULL,
      instructor_name VARCHAR(100) NOT NULL,
      instructor_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Database schema verified and synchronized successfully!');
}

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { runMigration };

