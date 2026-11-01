const express = require('express');
const router = express.Router();
const {
  getRoomUtilization,
  getAttendanceStatistics,
  getFacultyWorkload,
  getUFMSummary
} = require('../controllers/analyticsController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Restricted to ADMIN
router.use(verifyToken, requireRole('ADMIN'));

// TC09: Room Utilization
router.get('/room-utilization', getRoomUtilization);

// TC10: Attendance Statistics
router.get('/attendance-stats', getAttendanceStatistics);

// TC11: Faculty Workload
router.get('/faculty-workload', getFacultyWorkload);

// TC12: UFM Incident Summary
router.get('/ufm-summary', getUFMSummary);

module.exports = router;
