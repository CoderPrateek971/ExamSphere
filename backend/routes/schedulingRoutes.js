const express = require('express');
const router = express.Router();
const {
  getExams,
  getExam,
  validateSlot,
  createExam,
  updateExam,
  deleteExam,
  detectConflicts,
  generateTimetable,
  getTimetableMatrix,
  autoResolve,
  suggestSlot,
  seedDemoSchedule,
  clearSchedule,
  getDatesSpan,
  saveDatesSpan
} = require('../controllers/schedulingController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Scheduling endpoints require authentication
router.use(verifyToken);

// Read & validation endpoints: accessible by ADMIN and FACULTY
router.get('/dates-span', requireRole('ADMIN', 'FACULTY'), getDatesSpan);
router.get('/exams', requireRole('ADMIN', 'FACULTY'), getExams);
router.get('/exams/:id', requireRole('ADMIN', 'FACULTY'), getExam);
router.get('/conflicts', requireRole('ADMIN', 'FACULTY'), detectConflicts);
router.get('/matrix', requireRole('ADMIN', 'FACULTY'), getTimetableMatrix);
router.post('/validate-slot', requireRole('ADMIN', 'FACULTY'), validateSlot);
router.post('/suggest-slot', requireRole('ADMIN', 'FACULTY'), suggestSlot);

// Mutating endpoints: strictly ADMIN
router.post('/dates-span', requireRole('ADMIN'), saveDatesSpan);
router.post('/exams', requireRole('ADMIN'), createExam);

router.put('/exams/:id', requireRole('ADMIN'), updateExam);
router.delete('/exams/:id', requireRole('ADMIN'), deleteExam);
router.post('/generate', requireRole('ADMIN'), generateTimetable);
router.post('/auto-resolve', requireRole('ADMIN'), autoResolve);
router.post('/seed-demo', requireRole('ADMIN'), seedDemoSchedule);
router.delete('/clear-all', requireRole('ADMIN'), clearSchedule);

module.exports = router;
