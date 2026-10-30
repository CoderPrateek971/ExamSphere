const analyticsService = require('../services/analyticsService');

/**
 * Controller for Module 10: Analytics & Reports
 */

// TC09: Room Utilization Report
async function getRoomUtilization(req, res) {
  try {
    const data = await analyticsService.getRoomUtilization();
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('getRoomUtilization error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// TC10: Attendance Statistics Report
async function getAttendanceStatistics(req, res) {
  try {
    const data = await analyticsService.getAttendanceStatistics();
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('getAttendanceStatistics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// TC11: Faculty Workload Report
async function getFacultyWorkload(req, res) {
  try {
    const data = await analyticsService.getFacultyWorkload();
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('getFacultyWorkload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// TC12: UFM Incident Summary Report
async function getUFMSummary(req, res) {
  try {
    const data = await analyticsService.getUFMSummary();
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('getUFMSummary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getRoomUtilization,
  getAttendanceStatistics,
  getFacultyWorkload,
  getUFMSummary
};
