const express = require('express');
const router = express.Router();
const {
  allocateSeating,
  getSeatingForExam,
  getRoomSeatingGrid,
  getRoomsOverview,
  clearAllocations
} = require('../controllers/seatingController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Seating endpoints require authentication
router.use(verifyToken);

// Read endpoints: accessible by ADMIN and FACULTY
router.get('/rooms-overview', requireRole('ADMIN', 'FACULTY'), getRoomsOverview);
router.get('/exam/:examId', requireRole('ADMIN', 'FACULTY'), getSeatingForExam);
router.get('/room/:roomId/grid', requireRole('ADMIN', 'FACULTY'), getRoomSeatingGrid);

// Mutating endpoints: strictly ADMIN
router.post('/allocate', requireRole('ADMIN'), allocateSeating);
router.delete('/exam/:examId', requireRole('ADMIN'), clearAllocations);

module.exports = router;
