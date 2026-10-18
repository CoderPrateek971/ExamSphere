const express = require('express');
const router = express.Router();
const {
  getSchedule,
  getDuties,
  updateDutyStatus,
  getDoubts,
  createDoubt,
  resolveDoubt,
  getMetrics,
  getNotifications,
  sendDirectEmail
} = require('../controllers/facultyPortalController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// All Faculty Portal routes require authentication
router.use(verifyToken);

// Accessible by both FACULTY and ADMIN
router.get('/schedule', requireRole('FACULTY', 'ADMIN'), getSchedule);
router.get('/duties', requireRole('FACULTY', 'ADMIN'), getDuties);
router.put('/duties/:id/status', requireRole('FACULTY', 'ADMIN'), updateDutyStatus);
router.get('/doubts', requireRole('FACULTY', 'ADMIN'), getDoubts);
router.post('/doubts', requireRole('FACULTY', 'ADMIN'), createDoubt);
router.put('/doubts/:id/resolve', requireRole('FACULTY', 'ADMIN'), resolveDoubt);
router.get('/metrics', requireRole('FACULTY', 'ADMIN'), getMetrics);
router.get('/notifications', requireRole('FACULTY', 'ADMIN'), getNotifications);
router.post('/send-email', requireRole('FACULTY', 'ADMIN'), sendDirectEmail);

module.exports = router;
