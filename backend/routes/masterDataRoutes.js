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

// All master data endpoints require authentication & ADMIN role
router.use(verifyToken, requireRole('ADMIN'));

// Students
router.get('/students', getStudents);
router.post('/students', createStudent);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

// Faculty
router.get('/faculty', getFaculty);
router.post('/faculty', createFaculty);
router.put('/faculty/:id', updateFaculty);
router.delete('/faculty/:id', deleteFaculty);

// Courses
router.get('/courses', getCourses);
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// Rooms
router.get('/rooms', getRooms);
router.post('/rooms', createRoom);
router.put('/rooms/:id', updateRoom);
router.delete('/rooms/:id', deleteRoom);

// Bulk CSV Upload for any entity ('students', 'faculty', 'courses', 'rooms')
router.post('/upload-csv/:entityType', uploadCSV.single('file'), uploadMasterCSV);

// Reset / Wipe all records from database (clean slate for new file uploads)
router.post('/reset-database', async (req, res) => {
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

// Delete all records of a specific entity type ('courses', 'rooms', 'faculty', 'students') directly
router.delete('/clear/:entityType', async (req, res) => {
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
