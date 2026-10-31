const express = require('express');
const router = express.Router();
const {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  uploadMasterCSV
} = require('../controllers/masterDataController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { uploadCSV } = require('../middleware/uploadMiddleware');

// All master data endpoints require authentication
router.use(verifyToken);

// Read endpoints: accessible by ADMIN and FACULTY (needed for live room/doubt/duty routing)
router.get('/students', requireRole('ADMIN', 'FACULTY'), getStudents);
router.get('/faculty', requireRole('ADMIN', 'FACULTY'), getFaculty);
router.get('/courses', requireRole('ADMIN', 'FACULTY'), getCourses);
router.get('/rooms', requireRole('ADMIN', 'FACULTY'), getRooms);

// Students mutating endpoints: strictly ADMIN
router.post('/students', requireRole('ADMIN'), createStudent);
router.put('/students/:id', requireRole('ADMIN'), updateStudent);
router.delete('/students/:id', requireRole('ADMIN'), deleteStudent);

// Faculty mutating endpoints: strictly ADMIN
router.post('/faculty', requireRole('ADMIN'), createFaculty);
router.put('/faculty/:id', requireRole('ADMIN'), updateFaculty);
router.delete('/faculty/:id', requireRole('ADMIN'), deleteFaculty);

// Courses mutating endpoints: strictly ADMIN
router.post('/courses', requireRole('ADMIN'), createCourse);
router.put('/courses/:id', requireRole('ADMIN'), updateCourse);
router.delete('/courses/:id', requireRole('ADMIN'), deleteCourse);

// Rooms mutating endpoints: strictly ADMIN
router.post('/rooms', requireRole('ADMIN'), createRoom);
router.put('/rooms/:id', requireRole('ADMIN'), updateRoom);
router.delete('/rooms/:id', requireRole('ADMIN'), deleteRoom);

// Bulk CSV Upload for any entity ('students', 'faculty', 'courses', 'rooms') - strictly ADMIN
router.post('/upload-csv/:entityType', requireRole('ADMIN'), (req, res, next) => {
  uploadCSV.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Only CSV files are allowed' });
    }
    next();
  });
}, uploadMasterCSV);

// Reset / Wipe all records from database - strictly ADMIN
router.post('/reset-database', requireRole('ADMIN'), async (req, res) => {
  const { pool } = require('../config/db');
  if (!pool) return res.status(500).json({ success: false, message: 'Database not connected' });
  const conn = await pool.getConnection();
  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    const tables = [
      'invigilation_duties',
      'seat_allocations',
      'attendance',
      'stationery_records',
      'question_paper_logistics',
      'exam_scheduling_discussions',
      'ufm_reports',
      'doubt_requests',
      'notifications',
      'room_constraints',
      'exams',
      'course_section_instructors',
      'student_courses',
      'courses',
      'rooms',
      'faculty',
      'students',
      'audit_logs'
    ];
    for (const tbl of tables) {
      try {
        await conn.query(`DELETE FROM \`${tbl}\``);
      } catch (err) {
        if (err.errno !== 1146) console.warn(`Delete note for ${tbl}:`, err.message);
      }
    }
    await conn.query('DELETE FROM users WHERE role != "ADMIN"');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    res.json({ success: true, message: 'All database records cleared successfully. System is now clean and ready for fresh file uploads.' });
  } catch (err) {
    await conn.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

// Delete all records of a specific entity type ('courses', 'rooms', 'faculty', 'students') directly - strictly ADMIN
router.delete('/clear/:entityType', requireRole('ADMIN'), async (req, res) => {
  const { entityType } = req.params;
  const validTypes = ['students', 'faculty', 'courses', 'rooms'];
  if (!validTypes.includes(entityType)) {
    return res.status(400).json({ success: false, message: `Invalid entity type: ${entityType}` });
  }
  const { pool } = require('../config/db');
  if (!pool) return res.status(500).json({ success: false, message: 'Database not connected' });
  const conn = await pool.getConnection();
  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    if (entityType === 'courses') {
      await conn.query('DELETE FROM seat_allocations');
      await conn.query('DELETE FROM invigilation_duties');
      await conn.query('DELETE FROM attendance');
      await conn.query('DELETE FROM exams');
      await conn.query('DELETE FROM courses');
      await conn.query('DELETE FROM student_courses');
      await conn.query('DELETE FROM course_section_instructors');
    } else if (entityType === 'rooms') {
      await conn.query('DELETE FROM seat_allocations');
      await conn.query('DELETE FROM rooms');
      await conn.query('DELETE FROM room_constraints');
    } else if (entityType === 'faculty') {
      await conn.query('DELETE FROM invigilation_duties');
      await conn.query('DELETE FROM faculty');
      await conn.query('DELETE FROM users WHERE role = "FACULTY"');
    } else if (entityType === 'students') {
      await conn.query('DELETE FROM seat_allocations');
      await conn.query('DELETE FROM attendance');
      await conn.query('DELETE FROM students');
      await conn.query('DELETE FROM student_courses');
      await conn.query('DELETE FROM users WHERE role = "STUDENT"');
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    res.json({ success: true, message: `All ${entityType} deleted successfully.` });
  } catch (err) {
    await conn.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
