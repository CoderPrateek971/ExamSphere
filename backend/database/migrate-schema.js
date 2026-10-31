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

  // 7. Seed Demo Faculty Accounts
  try {
    const { hashPassword } = require('../utils/passwordHelper');
    const facultyPasswordHash = await hashPassword('faculty123');
    const demoAccounts = [
      { email: 'faculty@examsphere.edu', name: 'Dr. Shilpa Mahajan', code: 'FAC-SM-01', dept: 'CSE', desig: 'Professor' },
      { email: 'nishtha.gupta.24cse@bmu.edu.in', name: 'Prof. Nishtha Gupta', code: 'FAC-NG-01', dept: 'CSE', desig: 'Assistant Professor' },
      { email: 'prateek.garg.24cse@bmu.edu.in', name: 'Prof. Prateek Garg', code: 'FAC-PG-02', dept: 'CSE', desig: 'Associate Professor' },
      { email: 'riwan.bhati.24cse@bmu.edu.in', name: 'Prof. Riwan Bhati', code: 'FAC-RB-03', dept: 'CSE', desig: 'Assistant Professor' },
      { email: 'nischay.mehta.24cse@bmu.edu.in', name: 'Prof. Nischay Mehta', code: 'FAC-NM-04', dept: 'CSE', desig: 'Assistant Professor' },
      { email: 'invigilator@examsphere.edu', name: 'Demo Invigilator', code: 'INV001', dept: 'CSE', desig: 'Exam Invigilator' }
    ];

    for (const a of demoAccounts) {
      await query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES (?, ?, ?, 'FACULTY')
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
        [a.name, a.email, facultyPasswordHash]
      );
      const [uRows] = await query('SELECT id FROM users WHERE email = ?', [a.email]);
      const uId = uRows[0]?.id;
      if (uId) {
        await query(
          `INSERT INTO faculty (user_id, faculty_code, name, email, department, designation)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), faculty_code = VALUES(faculty_code)`,
          [uId, a.code, a.name, a.email, a.dept, a.desig]
        );
      }
    }
    console.log('✅ Demo faculty accounts verified/seeded.');
  } catch (seedErr) {
    console.warn('Demo faculty seed notice:', seedErr.message);
  }

  // 8. Ensure all Courses are mapped to Department Faculty Instructors
  try {
    const [courses] = await query('SELECT id, course_code, department FROM courses WHERE course_coordinator_id IS NULL OR course_coordinator_name IS NULL');
    if (courses.length > 0) {
      const [cseFac] = await query('SELECT id, name, email FROM faculty WHERE department = "CSE" ORDER BY id ASC');
      const [eceFac] = await query('SELECT id, name, email FROM faculty WHERE department = "ECE" ORDER BY id ASC');
      const [meFac] = await query('SELECT id, name, email FROM faculty WHERE department = "ME" ORDER BY id ASC');
      const [allFac] = await query('SELECT id, name, email FROM faculty ORDER BY id ASC');

      const harshit = cseFac.find(f => f.name.includes('Harshit Malhotra')) || cseFac[0];

      for (let i = 0; i < courses.length; i++) {
        const c = courses[i];
        let assigned = null;
        if (['CSE2001', 'CSE3002', 'CSE3020'].includes(c.course_code)) {
          assigned = harshit;
        } else if (c.department === 'CSE' && cseFac.length > 0) {
          assigned = cseFac[i % cseFac.length];
        } else if (c.department === 'ECE' && eceFac.length > 0) {
          assigned = eceFac[i % eceFac.length];
        } else if (c.department === 'ME' && meFac.length > 0) {
          assigned = meFac[i % meFac.length];
        } else {
          assigned = allFac[i % allFac.length];
        }

        if (assigned) {
          await query('UPDATE courses SET course_coordinator_id = ?, course_coordinator_name = ? WHERE id = ?', [
            assigned.id,
            assigned.name,
            c.id
          ]);
          await query('INSERT INTO course_section_instructors (course_id, section_name, instructor_name, instructor_id) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE instructor_name = VALUES(instructor_name)', [
            c.id,
            'Section A',
            assigned.name,
            assigned.id
          ]);
        }
      }
      console.log(`✅ Associated ${courses.length} courses to departmental faculty instructors.`);
    }
  } catch (mapErr) {
    console.warn('Course instructor mapping note:', mapErr.message);
  }

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

