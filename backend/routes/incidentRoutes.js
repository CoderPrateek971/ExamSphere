const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');

// Submit UFM incident report (Faculty / Invigilator or Admin)
router.post('/ufm', incidentController.submitReport);

// Get list of incident reports (Admin gets all, query can filter by faculty for faculty portal)
router.get('/ufm', incidentController.getReports);

// Get incident summary statistics for dashboard
router.get('/stats', incidentController.getStats);

// Get specific incident report dossier
router.get('/ufm/:id', incidentController.getReportById);

// Manage incident record: update review status & disciplinary action (Admin only)
router.put('/ufm/:id/action', incidentController.updateReportAction);

// Delete incident record (Admin only)
router.delete('/ufm/:id', incidentController.deleteReport);

module.exports = router;
