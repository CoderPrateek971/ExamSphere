const { query } = require('../config/db');

/**
 * Fetch recent audit logs
 * GET /api/admin/audit-logs
 */
async function getAuditLogs(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const [logs] = await query(
      `SELECT a.*, u.name as user_name, u.email as user_email, u.role as user_role
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC
       LIMIT ?`,
      [limit]
    );

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Fetch high-level system summary counts for Admin
 * GET /api/admin/system-summary
 */
async function getSystemSummary(req, res) {
  try {
    const [[{ studentCount }]] = await query('SELECT COUNT(*) as studentCount FROM students');
    const [[{ facultyCount }]] = await query('SELECT COUNT(*) as facultyCount FROM faculty');
    const [[{ courseCount }]] = await query('SELECT COUNT(*) as courseCount FROM courses');
    const [[{ roomCount }]] = await query('SELECT COUNT(*) as roomCount FROM rooms');
    const [[{ examCount }]] = await query('SELECT COUNT(*) as examCount FROM exams');
    
    let seatingCount = 0;
    try {
      const [[sRow]] = await query('SELECT COUNT(DISTINCT exam_id) as seatingCount FROM seat_allocations');
      seatingCount = sRow?.seatingCount || 0;
    } catch {}

    let dutyCount = 0;
    try {
      const [[dRow]] = await query('SELECT COUNT(*) as dutyCount FROM invigilation_duties');
      dutyCount = dRow?.dutyCount || 0;
    } catch {}

    let incidentCount = 0;
    try {
      const [[iRow]] = await query('SELECT COUNT(*) as incidentCount FROM ufm_reports');
      incidentCount = iRow?.incidentCount || 0;
    } catch {}

    res.json({
      success: true,
      data: {
        students: studentCount,
        faculty: facultyCount,
        courses: courseCount,
        rooms: roomCount,
        exams: examCount,
        seatingCount,
        dutyCount,
        incidentCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getAuditLogs,
  getSystemSummary
};
