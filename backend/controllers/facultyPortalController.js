const facultyPortalService = require('../services/facultyPortalService');

/**
 * Controller for Module 6: Faculty Portal & Doubt Resolution
 * Delegates all business logic to facultyPortalService
 */

async function getSchedule(req, res) {
  try {
    const email = req.query.email || (req.user?.role === 'FACULTY' ? req.user.email : null);
    const facultyId = req.user?.role === 'FACULTY' && !req.query.email ? req.user.faculty_id : req.query.facultyId;
    const data = await facultyPortalService.getFacultySchedule({
      facultyId,
      email,
      department: req.query.department,
      semester: req.query.semester,
      examType: req.query.examType,
      search: req.query.search
    });
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function getDuties(req, res) {
  try {
    const email = req.query.email || (req.user?.role === 'FACULTY' ? req.user.email : null);
    const facultyId = req.user?.role === 'FACULTY' && !req.query.email ? req.user.faculty_id : req.query.facultyId;
    const data = await facultyPortalService.getFacultyDuties({
      facultyId,
      email,
      status: req.query.status
    });
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function updateDutyStatus(req, res) {
  try {
    const facultyId = req.user?.role === 'FACULTY' ? req.user.faculty_id : null;
    const result = await facultyPortalService.updateDutyStatus({
      dutyId: req.params.id,
      facultyId,
      status: req.body.status,
      substituteFacultyId: req.body.substituteFacultyId,
      notes: req.body.notes
    });
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function getDoubts(req, res) {
  try {
    const email = req.query.email || (req.user?.role === 'FACULTY' ? req.user.email : null);
    const facultyId = req.user?.role === 'FACULTY' && !req.query.email ? req.user.faculty_id : req.query.facultyId;
    const data = await facultyPortalService.getDoubtRequests({
      facultyId,
      email,
      examId: req.query.examId,
      roomId: req.query.roomId,
      status: req.query.status,
      search: req.query.search
    });
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function createDoubt(req, res) {
  try {
    const invigilatorId = req.user?.role === 'FACULTY' ? req.user.faculty_id : req.body.invigilatorId;
    const invigilatorName = req.user?.name || req.body.invigilatorName;

    const result = await facultyPortalService.createDoubtRequest({
      ...req.body,
      invigilatorId,
      invigilatorName
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function resolveDoubt(req, res) {
  try {
    const facultyId = req.user?.role === 'FACULTY' ? req.user.faculty_id : null;
    const result = await facultyPortalService.resolveDoubtRequest({
      doubtId: req.params.id,
      facultyId,
      responseText: req.body.responseText,
      actionType: req.body.actionType
    });
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function getMetrics(req, res) {
  try {
    const email = req.query.email || (req.user?.role === 'FACULTY' ? req.user.email : null);
    const facultyId = req.user?.role === 'FACULTY' && !req.query.email ? req.user.faculty_id : req.query.facultyId;
    const data = await facultyPortalService.getFacultySummaryMetrics({ facultyId, email });
    res.json({ success: true, data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function getNotifications(req, res) {
  try {
    const facultyEmail = req.query.email || (req.user?.role === 'FACULTY' ? req.user.email : null);
    const data = await facultyPortalService.getNotificationsList({
      facultyEmail,
      limit: req.query.limit
    });
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function sendDirectEmail(req, res) {
  try {
    const senderName = req.user?.name || 'Exam Controller / Invigilator';
    const senderEmail = req.user?.email || 'controller@examsphere.edu';
    const result = await facultyPortalService.sendDirectFacultyEmail({
      ...req.body,
      senderName,
      senderEmail
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getSchedule,
  getDuties,
  updateDutyStatus,
  getDoubts,
  createDoubt,
  resolveDoubt,
  getMetrics,
  getNotifications,
  sendDirectEmail
};
