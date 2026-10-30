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
  try {
    const { query } = require('../config/db');
    await query('SET FOREIGN_KEY_CHECKS = 0');
    await query('TRUNCATE TABLE invigilation_duties');
    await query('TRUNCATE TABLE seat_allocations');
    await query('TRUNCATE TABLE attendance');
    await query('TRUNCATE TABLE stationery_records');
    await query('TRUNCATE TABLE question_paper_logistics');
    await query('TRUNCATE TABLE exam_scheduling_discussions');
    await query('TRUNCATE TABLE ufm_reports');
    await query('TRUNCATE TABLE doubt_requests');
    await query('TRUNCATE TABLE notifications');
    await query('TRUNCATE TABLE room_constraints');
    await query('TRUNCATE TABLE exams');
    await query('TRUNCATE TABLE course_section_instructors');
    await query('TRUNCATE TABLE student_courses');
    await query('TRUNCATE TABLE courses');
    await query('TRUNCATE TABLE rooms');
    await query('TRUNCATE TABLE faculty');
    await query('TRUNCATE TABLE students');
    await query('DELETE FROM users WHERE role != "ADMIN"');
    await query('TRUNCATE TABLE audit_logs');
    await query('SET FOREIGN_KEY_CHECKS = 1');
    res.json({ success: true, message: 'All database records cleared successfully. System is now clean and ready for fresh file uploads.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete all records of a specific entity type ('courses', 'rooms', 'faculty', 'students') directly
router.delete('/clear/:entityType', async (req, res) => {
  const { entityType } = req.params;
  const validTypes = ['students', 'faculty', 'courses', 'rooms'];
  if (!validTypes.includes(entityType)) {
    return res.status(400).json({ success: false, message: `Invalid entity type: ${entityType}` });
  }
  try {
    const { query } = require('../config/db');
    await query('SET FOREIGN_KEY_CHECKS = 0');
    if (entityType === 'courses') {
      await query('TRUNCATE TABLE courses');
      await query('TRUNCATE TABLE student_courses');
      await query('TRUNCATE TABLE course_section_instructors');
    } else if (entityType === 'rooms') {
      await query('TRUNCATE TABLE rooms');
      await query('TRUNCATE TABLE room_constraints');
    } else if (entityType === 'faculty') {
      await query('TRUNCATE TABLE faculty');
      await query('DELETE FROM users WHERE role = "FACULTY"');
    } else if (entityType === 'students') {
      await query('TRUNCATE TABLE students');
      await query('TRUNCATE TABLE student_courses');
      await query('DELETE FROM users WHERE role = "STUDENT"');
    }
    await query('SET FOREIGN_KEY_CHECKS = 1');
    res.json({ success: true, message: `All ${entityType} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
