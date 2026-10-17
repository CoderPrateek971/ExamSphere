const { query } = require('../config/db');
const { hashPassword } = require('../utils/passwordHelper');

async function checkAndSeedFaculty() {
  try {
    const [users] = await query('SELECT id, name, email, role FROM users');
    console.log('Existing users in DB:', users);

    const hasFaculty = users.some(u => u.email === 'faculty@examsphere.edu');
    if (!hasFaculty) {
      console.log('Seeding faculty@examsphere.edu in users table...');
      const hash = await hashPassword('faculty123');
      const [res] = await query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        ['Dr. Shilpa Mahajan', 'faculty@examsphere.edu', hash, 'FACULTY']
      );
      console.log('Seeded faculty user with ID:', res.insertId);

      // Link to faculty table
      await query(
        `INSERT INTO faculty (user_id, faculty_code, name, email, department, designation, seniority_level, max_duties)
         VALUES (?, 'FAC101', 'Dr. Shilpa Mahajan', 'faculty@examsphere.edu', 'CSE', 'Associate Professor', 2, 4)
         ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), email = VALUES(email)`,
        [res.insertId]
      );
      console.log('Linked to faculty table successfully.');
    } else {
      console.log('faculty@examsphere.edu already exists in DB.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
}

checkAndSeedFaculty();
