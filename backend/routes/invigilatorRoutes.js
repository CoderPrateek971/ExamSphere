const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const invigilatorController = require('../controllers/invigilatorController');

// All invigilator endpoints require valid authentication and FACULTY or ADMIN role
router.use(verifyToken);
router.use(requireRole('FACULTY', 'ADMIN'));

// Duties Management
router.get('/duties', invigilatorController.getDuties);
router.post('/duties/:dutyId/confirm', invigilatorController.confirmDuty);
router.get('/duties/:dutyId/students', invigilatorController.getDutyStudents);
router.post('/seed-duties', invigilatorController.seedDuties);

// Attendance & Verification
router.get('/attendance/overview', invigilatorController.getAttendanceOverview);
router.post('/attendance/mark', invigilatorController.markAttendance);
router.post('/attendance/bulk', invigilatorController.bulkMarkAttendance);
router.post('/attendance/verify-face', invigilatorController.verifyFace);
router.post('/attendance/:dutyId/reset', invigilatorController.resetAttendance);

module.exports = router;
