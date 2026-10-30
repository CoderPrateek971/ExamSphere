const { query } = require('../config/db');

/**
 * Default realistic UFM Incident Records for initial demonstration
 * Ensures the system is immediately active, inspectable, and demonstrable even with an empty database.
 */
const DEFAULT_INCIDENTS = [
  {
    id: 1,
    report_number: 'UFM-2026-001',
    exam_id: 1,
    exam_name: 'CSE3005 Software Engineering End-Term',
    course_code: 'CSE3005',
    student_id: 101,
    student_name: 'Aman Sharma',
    student_roll: '21BCSE1042',
    student_dept: 'Computer Science & Engineering',
    room_id: 1,
    room_number: 'E2-101',
    invigilator_id: 1,
    invigilator_name: 'Dr. Shilpa Mahajan',
    invigilator_department: 'CSE',
    incident_date: '2026-11-20',
    incident_time: '10:45 AM',
    incident_type: 'UNAUTHORIZED_NOTES',
    severity: 'HIGH',
    material_confiscated: 'Three handwritten formula chits concealed under candidate admit card and ruler.',
    incident_details: 'Candidate was observed repeatedly looking down under his desk. Upon surprise inspection by the invigilator, three handwritten micro-sheets containing structural design patterns and UML class diagram syntax were retrieved from beneath his hall ticket.',
    student_statement: 'I brought the chits for quick revision outside the hall and forgot they were tucked inside my transparent exam clipboard. I did not copy from them during the exam.',
    witness_name: 'Prof. Harsh Taneja (Co-Invigilator)',
    evidence_photo_url: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80',
    status: 'UNDER_REVIEW',
    committee_remarks: 'Case referred to Central Examination Disciplinary Committee. Material handwriting matches candidate answer booklet.',
    penalty_imposed: '',
    resolved_by: '',
    resolved_at: null,
    created_at: '2026-11-20T11:05:00Z'
  },
  {
    id: 2,
    report_number: 'UFM-2026-002',
    exam_id: 1,
    exam_name: 'CSE3005 Software Engineering End-Term',
    course_code: 'CSE3005',
    student_id: 102,
    student_name: 'Rohan Verma',
    student_roll: '21BCSE1089',
    student_dept: 'Computer Science & Engineering',
    room_id: 3,
    room_number: 'E2-201',
    invigilator_id: 2,
    invigilator_name: 'Dr. Nishtha Phutela',
    invigilator_department: 'CSE',
    incident_date: '2026-11-20',
    incident_time: '11:15 AM',
    incident_type: 'MOBILE_DEVICE',
    severity: 'CRITICAL',
    material_confiscated: 'One Samsung Galaxy smartphone concealed inside jacket pocket with active internet connectivity.',
    incident_details: 'Vibration sound detected from row 3. The candidate was found with a smartphone concealed in his inner fleece jacket pocket displaying an academic forum discussing question 4(b). Phone seized immediately with screen state documented.',
    student_statement: 'My phone was on silent and I forgot to submit it at the entrance desk before entering the examination room.',
    witness_name: 'Dr. Sukhandeep Kaur (Flying Squad)',
    evidence_photo_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
    status: 'ACTION_TAKEN',
    committee_remarks: 'Disciplinary Committee convened on 20-Nov-2026. Electronic possession during examination confirmed.',
    penalty_imposed: 'Exam Paper Cancelled & Debarred for 1 Academic Semester',
    resolved_by: 'Dr. Rajesh Goel (Controller of Examinations)',
    resolved_at: '2026-11-20T14:30:00Z',
    created_at: '2026-11-20T11:30:00Z'
  },
  {
    id: 3,
    report_number: 'UFM-2026-003',
    exam_id: 2,
    exam_name: 'CSE3002 Database Management Systems Final',
    course_code: 'CSE3002',
    student_id: 103,
    student_name: 'Priya Nair',
    student_roll: '21BECE1015',
    student_dept: 'Electronics & Communication',
    room_id: 2,
    room_number: 'E2-102',
    invigilator_id: 3,
    invigilator_name: 'Dr. Harsh Taneja',
    invigilator_department: 'ECE',
    incident_date: '2026-11-22',
    incident_time: '10:10 AM',
    incident_type: 'SMARTWATCH_DEVICE',
    severity: 'MEDIUM',
    material_confiscated: 'Apple Watch Series 7 with saved photo screenshots of SQL normalization tables.',
    incident_details: 'Invigilator noticed candidate tapping screen of wrist smartwatch. Device verified to have saved lecture slides and SQL command sheets in photo gallery.',
    student_statement: 'I wear this watch every day for fitness tracking and did not intend to use it maliciously.',
    witness_name: 'Dr. Shilpa Mahajan',
    evidence_photo_url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=600&q=80',
    status: 'REPORTED',
    committee_remarks: 'Initial report filed. Pending formal hearing on Monday.',
    penalty_imposed: '',
    resolved_by: '',
    resolved_at: null,
    created_at: '2026-11-22T10:25:00Z'
  }
];

// In-memory store for fallback/dev execution
let inMemoryIncidents = [...DEFAULT_INCIDENTS];

class IncidentService {
  /**
   * Submit an Unfair Means (UFM) report
   */
  async createReport(data) {
    const reportNumber = `UFM-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    const newRecord = {
      id: Date.now(),
      report_number: reportNumber,
      exam_id: Number(data.exam_id) || 1,
      exam_name: data.exam_name || 'Semester End Examination',
      course_code: data.course_code || 'CSE3005',
      student_id: Number(data.student_id) || null,
      student_name: data.student_name || 'Candidate',
      student_roll: data.student_roll || '21BCSE0000',
      student_dept: data.student_dept || 'General',
      room_id: Number(data.room_id) || 1,
      room_number: data.room_number || 'Room 101',
      invigilator_id: Number(data.invigilator_id) || 1,
      invigilator_name: data.invigilator_name || 'Invigilator',
      invigilator_department: data.invigilator_department || 'Faculty',
      incident_date: data.incident_date || new Date().toISOString().split('T')[0],
      incident_time: data.incident_time || '10:00 AM',
      incident_type: data.incident_type || 'UNAUTHORIZED_NOTES',
      severity: data.severity || 'MEDIUM',
      material_confiscated: data.material_confiscated || '',
      incident_details: data.incident_details || '',
      student_statement: data.student_statement || '',
      witness_name: data.witness_name || '',
      evidence_photo_url: data.evidence_photo_url || '',
      status: 'REPORTED',
      committee_remarks: '',
      penalty_imposed: '',
      resolved_by: '',
      resolved_at: null,
      created_at: new Date().toISOString()
    };

    // Try persisting to MySQL if available
    try {
      const fullSql = `
        INSERT INTO ufm_reports (
          report_number, exam_id, exam_name, course_code, student_id, student_name,
          student_roll, student_dept, room_id, room_number, desk_number, invigilator_id,
          invigilator_name, invigilator_department, incident_date, incident_time,
          incident_type, severity, material_confiscated, incident_details,
          student_statement, witness_name, evidence_photo_url, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [result] = await query(fullSql, [
        newRecord.report_number, newRecord.exam_id, newRecord.exam_name, newRecord.course_code,
        newRecord.student_id, newRecord.student_name, newRecord.student_roll, newRecord.student_dept,
        newRecord.room_id, newRecord.room_number, newRecord.desk_number, newRecord.invigilator_id,
        newRecord.invigilator_name, newRecord.invigilator_department, newRecord.incident_date, newRecord.incident_time,
        newRecord.incident_type, newRecord.severity, newRecord.material_confiscated, newRecord.incident_details,
        newRecord.student_statement, newRecord.witness_name, newRecord.evidence_photo_url, 'REPORTED'
      ]);
      if (result && result.insertId) {
        newRecord.id = result.insertId;
      }
    } catch (err) {
      // Fallback to legacy basic schema if database has initial schema
      try {
        const legacySql = `
          INSERT INTO ufm_reports (
            exam_id, student_id, room_id, invigilator_id, incident_details,
            evidence_photo_url, student_statement, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await query(legacySql, [
          newRecord.exam_id,
          newRecord.student_id || 1,
          newRecord.room_id,
          newRecord.invigilator_id,
          `${newRecord.report_number} | ${newRecord.incident_type} | ${newRecord.material_confiscated} | ${newRecord.incident_details}`,
          newRecord.evidence_photo_url.slice(0, 255),
          newRecord.student_statement,
          'REPORTED'
        ]);
        if (result && result.insertId) {
          newRecord.id = result.insertId;
        }
      } catch (legacyErr) {
        console.warn('MySQL persistence note for UFM report, saved to in-memory store:', legacyErr.message);
      }
    }

    inMemoryIncidents.unshift(newRecord);
    return newRecord;
  }

  /**
   * Get all incident reports with optional filters
   */
  async getAllReports(filters = {}) {
    let results = [...inMemoryIncidents];

    if (filters.status && filters.status !== 'ALL') {
      results = results.filter(r => r.status === filters.status);
    }
    if (filters.severity && filters.severity !== 'ALL') {
      results = results.filter(r => r.severity === filters.severity);
    }
    if (filters.incident_type && filters.incident_type !== 'ALL') {
      results = results.filter(r => r.incident_type === filters.incident_type);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(r => 
        r.report_number.toLowerCase().includes(q) ||
        r.student_name.toLowerCase().includes(q) ||
        r.student_roll.toLowerCase().includes(q) ||
        r.exam_name.toLowerCase().includes(q) ||
        r.room_number.toLowerCase().includes(q) ||
        r.invigilator_name.toLowerCase().includes(q)
      );
    }

    return results;
  }

  /**
   * Get reports submitted by a specific faculty member (For Faculty Portal)
   */
  async getReportsByFaculty(facultyName, facultyId) {
    return inMemoryIncidents.filter(r => {
      if (facultyId && Number(r.invigilator_id) === Number(facultyId)) return true;
      if (facultyName && r.invigilator_name.toLowerCase().includes(facultyName.toLowerCase())) return true;
      return false;
    });
  }

  /**
   * Get single report by ID
   */
  async getReportById(id) {
    const report = inMemoryIncidents.find(r => Number(r.id) === Number(id));
    if (!report) {
      const err = new Error(`Incident report with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }
    return report;
  }

  /**
   * Manage incident record: update review status, penalty, and committee remarks (Admin Only)
   */
  async updateReportAction(id, { status, committee_remarks, penalty_imposed, resolved_by }) {
    const index = inMemoryIncidents.findIndex(r => Number(r.id) === Number(id));
    if (index === -1) {
      const err = new Error(`Incident report with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }

    const updated = {
      ...inMemoryIncidents[index],
      status: status || inMemoryIncidents[index].status,
      committee_remarks: committee_remarks !== undefined ? committee_remarks : inMemoryIncidents[index].committee_remarks,
      penalty_imposed: penalty_imposed !== undefined ? penalty_imposed : inMemoryIncidents[index].penalty_imposed,
      resolved_by: resolved_by || 'Disciplinary Committee / Exam Controller',
      resolved_at: status === 'ACTION_TAKEN' || status === 'DISMISSED' ? new Date().toISOString() : inMemoryIncidents[index].resolved_at
    };

    inMemoryIncidents[index] = updated;

    // Try updating MySQL if available
    try {
      await query(
        `UPDATE ufm_reports SET status = ?, student_statement = ? WHERE id = ?`,
        [updated.status, updated.committee_remarks, id]
      );
    } catch (err) {
      console.warn('MySQL update note for UFM report:', err.message);
    }

    return updated;
  }

  /**
   * Aggregate incident statistics for Administrator Dashboard
   */
  async getIncidentStats() {
    const total = inMemoryIncidents.length;
    const reported = inMemoryIncidents.filter(r => r.status === 'REPORTED').length;
    const underReview = inMemoryIncidents.filter(r => r.status === 'UNDER_REVIEW').length;
    const actionTaken = inMemoryIncidents.filter(r => r.status === 'ACTION_TAKEN').length;
    const dismissed = inMemoryIncidents.filter(r => r.status === 'DISMISSED').length;
    const criticalCount = inMemoryIncidents.filter(r => r.severity === 'CRITICAL' || r.severity === 'HIGH').length;

    // Room hotspots
    const roomCounts = {};
    inMemoryIncidents.forEach(r => {
      roomCounts[r.room_number] = (roomCounts[r.room_number] || 0) + 1;
    });

    // Infraction category counts
    const categoryCounts = {};
    inMemoryIncidents.forEach(r => {
      categoryCounts[r.incident_type] = (categoryCounts[r.incident_type] || 0) + 1;
    });

    return {
      total,
      reported,
      underReview,
      actionTaken,
      dismissed,
      criticalCount,
      roomCounts,
      categoryCounts
    };
  }

  /**
   * Delete incident record (Admin only)
   */
  async deleteReport(id) {
    inMemoryIncidents = inMemoryIncidents.filter(r => Number(r.id) !== Number(id));
    try {
      await query('DELETE FROM ufm_reports WHERE id = ?', [id]);
    } catch (err) {
      console.warn('MySQL delete note for UFM report:', err.message);
    }
    return { success: true, message: `Report ${id} deleted.` };
  }
}

module.exports = new IncidentService();
