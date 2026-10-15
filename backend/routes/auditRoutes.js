const express = require('express');
const router = express.Router();
const { getAuditLogs, getSystemSummary } = require('../controllers/auditController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Restricted to ADMIN
router.use(verifyToken, requireRole('ADMIN'));

router.get('/audit-logs', getAuditLogs);
router.get('/system-summary', getSystemSummary);

module.exports = router;
