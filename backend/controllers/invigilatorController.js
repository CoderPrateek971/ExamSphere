const invigilatorService = require('../services/invigilatorService');

/**
 * Controller handling Invigilator Portal & Attendance API requests
 */
async function getDuties(req, res) {
  try {
    let facultyId = req.user.faculty_id || req.query.faculty_id || null;
    if (!facultyId && req.user.role === 'FACULTY') {
      const { query } = require('../config/db');
      const [facList] = await query('SELECT id FROM faculty WHERE user_id = ? OR LOWER(email) = ?', [req.user.id, (req.user.email || '').toLowerCase()]);
      if (facList.length > 0) {
        facultyId = facList[0].id;
      }
    }
    const duties = await invigilatorService.getDutiesForFaculty(facultyId, req.user.role);
    return res.status(200).json({
      success: true,
      data: duties
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve invigilation duties.'
    });
  }
}

async function confirmDuty(req, res) {
  try {
    const { dutyId } = req.params;
    const status = req.body.status || 'CONFIRMED';
    const result = await invigilatorService.updateDutyStatus(dutyId, status);
    return res.status(200).json({
      success: true,
      message: `Duty status updated to ${status}.`,
      data: result
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update duty status.'
    });
  }
}

async function getDutyStudents(req, res) {
  try {
    const { dutyId } = req.params;
    const result = await invigilatorService.getDutyStudents(dutyId);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve classroom students.'
    });
  }
}

async function markAttendance(req, res) {
  try {
    const { exam_id, student_id, room_id, status, verification_method, face_confidence, photo_path, photo_base64 } = req.body;
    const result = await invigilatorService.markAttendance({
      exam_id,
      student_id,
      room_id,
      status: status || 'PRESENT',
      verification_method: verification_method || 'MANUAL',
      face_confidence,
      photo_path,
      photo_base64,
      userId: req.user.id
    });
    return res.status(200).json({
      success: true,
      message: `Attendance marked as ${status}.`,
      data: result
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to mark attendance.'
    });
  }
}

async function bulkMarkAttendance(req, res) {
  try {
    const { dutyId, status, verification_method } = req.body;
    const result = await invigilatorService.bulkMarkAttendance({
      dutyId,
      status: status || 'PRESENT',
      verification_method: verification_method || 'MANUAL',
      userId: req.user.id
    });
    return res.status(200).json({
      success: true,
      message: `Bulk marked ${result.count} students as ${status}.`,
      data: result
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to bulk mark attendance.'
    });
  }
}

async function verifyFace(req, res) {
  try {
    const { dutyId, studentId, imageBase64 } = req.body;
    const result = await invigilatorService.verifyFaceMatch({
      dutyId,
      studentId,
      capturedImageBase64: imageBase64,
      userId: req.user.id
    });
    return res.status(200).json({
      success: true,
      message: result.isMatch ? 'Face Match Confirmed!' : 'Face Match Inconclusive.',
      data: result
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Face matching failed.'
    });
  }
}

async function resetAttendance(req, res) {
  try {
    const { dutyId } = req.params;
    const result = await invigilatorService.resetAttendance(dutyId, req.user.id);
    return res.status(200).json({
      success: true,
      message: `Reset ${result.clearedCount} attendance records for this duty session.`,
      data: result
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to reset attendance.'
    });
  }
}

async function seedDuties(req, res) {
  try {
    const result = await invigilatorService.seedDemoDutiesIfEmpty();
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

async function getAttendanceOverview(req, res) {
  try {
    const { examId, roomId, status, method, search } = req.query;
    const result = await invigilatorService.getAllExamAttendance({
      examId: examId || null,
      roomId: roomId || null,
      status: status || null,
      method: method || null,
      search: search || null
    });
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch attendance overview.'
    });
  }
}

module.exports = {
  getDuties,
  confirmDuty,
  getDutyStudents,
  markAttendance,
  bulkMarkAttendance,
  verifyFace,
  resetAttendance,
  seedDuties,
  getAttendanceOverview
};
