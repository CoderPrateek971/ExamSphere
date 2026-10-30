const { query } = require('../config/db');

/**
 * Module 10: Analytics & Reports Service
 * Provides business logic for aggregated administrative reporting:
 * - TC09: Room Utilization Report
 * - TC10: Attendance Statistics Report
 * - TC11: Faculty Workload Report
 * - TC12: UFM Incident Summary Report
 */
class AnalyticsService {
  /**
   * TC09: Room Utilization Report
   * Total campus seats vs allocated seats and room-by-room utilization percentage
   */
  async getRoomUtilization() {
    // 1. Total campus seats
    const [[{ totalCapacity }]] = await query('SELECT COALESCE(SUM(capacity), 0) as totalCapacity FROM rooms');
    
    // 2. Total allocated seats
    const [[{ totalAllocated }]] = await query('SELECT COUNT(*) as totalAllocated FROM seat_allocations');
    
    // 3. Per-room utilization breakdown
    const [roomStats] = await query(`
      SELECT 
        r.id,
        r.room_number,
        r.building,
        r.floor,
        r.capacity,
        COALESCE(COUNT(sa.id), 0) AS allocated_seats,
        ROUND((COALESCE(COUNT(sa.id), 0) / r.capacity) * 100, 1) AS utilization_percentage
      FROM rooms r
      LEFT JOIN seat_allocations sa ON r.id = sa.room_id
      GROUP BY r.id, r.room_number, r.building, r.floor, r.capacity
      ORDER BY r.room_number ASC
    `);

    const campusUtilizationRate = totalCapacity > 0 
      ? Math.round((totalAllocated / totalCapacity) * 100 * 10) / 10 
      : 0;

    return {
      totalCampusCapacity: Number(totalCapacity),
      totalAllocatedSeats: Number(totalAllocated),
      availableSeats: Math.max(0, Number(totalCapacity) - Number(totalAllocated)),
      overallUtilizationRate: campusUtilizationRate,
      roomBreakdown: roomStats.map(r => ({
        id: r.id,
        roomNumber: r.room_number,
        building: r.building,
        floor: r.floor,
        capacity: Number(r.capacity),
        allocatedSeats: Number(r.allocated_seats),
        utilizationPercentage: Number(r.utilization_percentage)
      }))
    };
  }

  /**
   * TC10: Attendance Statistics Report
   * Candidate marked present vs absent counts and overall attendance percentage
   */
  async getAttendanceStatistics() {
    const [[{ totalMarked }]] = await query('SELECT COUNT(*) as totalMarked FROM attendance');
    const [[{ presentCount }]] = await query("SELECT COUNT(*) as presentCount FROM attendance WHERE status = 'PRESENT'");
    const [[{ absentCount }]] = await query("SELECT COUNT(*) as absentCount FROM attendance WHERE status = 'ABSENT'");
    const [[{ flaggedCount }]] = await query("SELECT COUNT(*) as flaggedCount FROM attendance WHERE status = 'FLAGGED'");
    
    // Face-verified count
    const [[{ faceVerifiedCount }]] = await query("SELECT COUNT(*) as faceVerifiedCount FROM attendance WHERE verification_method = 'FACE_MATCH'");

    // Total enrolled candidates across exams
    const [[{ totalCandidates }]] = await query('SELECT COUNT(*) as totalCandidates FROM seat_allocations');

    const effectiveTotal = Number(totalMarked) > 0 ? Number(totalMarked) : Number(totalCandidates);
    const attendanceRate = effectiveTotal > 0 
      ? Math.round((Number(presentCount) / effectiveTotal) * 100 * 10) / 10 
      : 0;

    // Per-exam breakdown
    const [examBreakdown] = await query(`
      SELECT 
        e.id,
        e.exam_name,
        e.exam_date,
        COUNT(a.id) as total_attendance_marked,
        SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) as absent_count
      FROM exams e
      LEFT JOIN attendance a ON e.id = a.exam_id
      GROUP BY e.id, e.exam_name, e.exam_date
      ORDER BY e.exam_date ASC
    `);

    return {
      totalEnrolledCandidates: Number(totalCandidates),
      totalMarkedAttendance: Number(totalMarked),
      presentCount: Number(presentCount),
      absentCount: Number(absentCount),
      flaggedCount: Number(flaggedCount),
      faceVerifiedCount: Number(faceVerifiedCount),
      attendanceRate,
      examBreakdown: examBreakdown.map(eb => ({
        examId: eb.id,
        examName: eb.exam_name,
        examDate: eb.exam_date,
        totalMarked: Number(eb.total_attendance_marked),
        present: Number(eb.present_count || 0),
        absent: Number(eb.absent_count || 0),
        rate: Number(eb.total_attendance_marked) > 0 
          ? Math.round((Number(eb.present_count || 0) / Number(eb.total_attendance_marked)) * 100) 
          : 0
      }))
    };
  }

  /**
   * TC11: Faculty Workload Report
   * List of professors with their total assigned duties vs maximum duty capacities
   */
  async getFacultyWorkload() {
    const [facultyDuties] = await query(`
      SELECT 
        f.id,
        f.faculty_code,
        f.name,
        f.email,
        f.department,
        f.designation,
        f.seniority_level,
        f.max_duties,
        COALESCE(COUNT(d.id), 0) as assigned_duties
      FROM faculty f
      LEFT JOIN invigilation_duties d ON f.id = d.faculty_id
      GROUP BY f.id, f.faculty_code, f.name, f.email, f.department, f.designation, f.seniority_level, f.max_duties
      ORDER BY assigned_duties DESC, f.name ASC
    `);

    const totalDuties = facultyDuties.reduce((acc, f) => acc + Number(f.assigned_duties), 0);
    const totalFaculty = facultyDuties.length;
    const avgDuty = totalFaculty > 0 ? (totalDuties / totalFaculty).toFixed(1) : 0;

    return {
      totalFacultyMembers: totalFaculty,
      totalDutiesAssigned: totalDuties,
      averageDutiesPerFaculty: Number(avgDuty),
      facultyRoster: facultyDuties.map(f => ({
        id: f.id,
        facultyCode: f.faculty_code,
        name: f.name,
        email: f.email,
        department: f.department,
        designation: f.designation,
        seniorityLevel: Number(f.seniority_level || 1),
        maxDuties: Number(f.max_duties || 5),
        assignedDuties: Number(f.assigned_duties),
        remainingCapacity: Math.max(0, Number(f.max_duties || 5) - Number(f.assigned_duties)),
        utilizationRate: Math.round((Number(f.assigned_duties) / Number(f.max_duties || 5)) * 100)
      }))
    };
  }

  /**
   * TC12: UFM Incident Summary Report
   * Cheating incident cases breakdown by review status and hall distribution
   */
  async getUFMSummary() {
    const [[{ totalCases }]] = await query('SELECT COUNT(*) as totalCases FROM ufm_reports');
    
    // Breakdown by review status
    const [statusRows] = await query(`
      SELECT status, COUNT(*) as count 
      FROM ufm_reports 
      GROUP BY status
    `);

    const statusBreakdown = {
      REPORTED: 0,
      UNDER_REVIEW: 0,
      ACTION_TAKEN: 0,
      DISMISSED: 0
    };

    statusRows.forEach(row => {
      if (statusBreakdown.hasOwnProperty(row.status)) {
        statusBreakdown[row.status] = Number(row.count);
      }
    });

    // Recent cases list with student and exam details
    const [cases] = await query(`
      SELECT 
        u.id,
        u.incident_details,
        u.status,
        u.created_at,
        u.evidence_photo_url,
        s.name as student_name,
        s.enrollment_no,
        s.department as student_department,
        r.room_number,
        f.name as invigilator_name,
        e.exam_name
      FROM ufm_reports u
      LEFT JOIN students s ON u.student_id = s.id
      LEFT JOIN rooms r ON u.room_id = r.id
      LEFT JOIN faculty f ON u.invigilator_id = f.id
      LEFT JOIN exams e ON u.exam_id = e.id
      ORDER BY u.created_at DESC
      LIMIT 20
    `);

    return {
      totalCases: Number(totalCases),
      statusBreakdown,
      cases: cases.map(c => ({
        id: c.id,
        studentName: c.student_name || 'Candidate',
        enrollmentNo: c.enrollment_no || 'N/A',
        department: c.student_department || 'General',
        roomNumber: c.room_number || 'Hall',
        invigilatorName: c.invigilator_name || 'Invigilator',
        examName: c.exam_name || 'Exam',
        incidentDetails: c.incident_details,
        status: c.status,
        hasPhoto: Boolean(c.evidence_photo_url),
        reportedAt: c.created_at
      }))
    };
  }
}

module.exports = new AnalyticsService();
