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
    const safeTruncate = async (tbl) => {
      try {
        await query(`TRUNCATE TABLE \`${tbl}\``);
      } catch (err) {
        if (err.errno !== 1146) console.warn(`Truncate note for ${tbl}:`, err.message);
      }
    };

    await query('SET FOREIGN_KEY_CHECKS = 0');
    await safeTruncate('invigilation_duties');
    await safeTruncate('seat_allocations');
    await safeTruncate('attendance');
    await safeTruncate('stationery_records');
    await safeTruncate('question_paper_logistics');
    await safeTruncate('exam_scheduling_discussions');
    await safeTruncate('ufm_reports');
    await safeTruncate('doubt_requests');
    await safeTruncate('notifications');
    await safeTruncate('room_constraints');
    await safeTruncate('exams');
    await safeTruncate('course_section_instructors');
    await safeTruncate('student_courses');
    await safeTruncate('courses');
    await safeTruncate('rooms');
    await safeTruncate('faculty');
    await safeTruncate('students');
    await query('DELETE FROM users WHERE role != "ADMIN"');
    await safeTruncate('audit_logs');
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
    const safeTruncate = async (tbl) => {
      try {
        await query(`TRUNCATE TABLE \`${tbl}\``);
      } catch (err) {
        if (err.errno !== 1146) console.warn(`Truncate note for ${tbl}:`, err.message);
      }
    };

    await query('SET FOREIGN_KEY_CHECKS = 0');
    if (entityType === 'courses') {
      await safeTruncate('courses');
      await safeTruncate('student_courses');
      await safeTruncate('course_section_instructors');
    } else if (entityType === 'rooms') {
      await safeTruncate('rooms');
      await safeTruncate('room_constraints');
    } else if (entityType === 'faculty') {
      await safeTruncate('faculty');
      await query('DELETE FROM users WHERE role = "FACULTY"');
    } else if (entityType === 'students') {
      await safeTruncate('students');
      await safeTruncate('student_courses');
      await query('DELETE FROM users WHERE role = "STUDENT"');
    }
    await query('SET FOREIGN_KEY_CHECKS = 1');
    res.json({ success: true, message: `All ${entityType} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
