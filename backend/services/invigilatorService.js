const fs = require('fs');
const path = require('path');
const { query } = require('../config/db');

/**
 * Service handling Invigilator Duties, Student Identity Verification,
 * Biometric Camera Face Matching, and Real-Time Attendance Recording.
 */
class InvigilatorService {
  /**
   * Seed realistic invigilation duties if the table is currently empty,
   * ensuring that scheduled exams and allocated rooms have assigned invigilators.
   */
  async seedDemoDutiesIfEmpty() {
    try {
      const [existing] = await query('SELECT COUNT(*) as cnt FROM invigilation_duties');
      if (existing[0].cnt > 0) {
        return { seeded: false, count: existing[0].cnt };
      }

      // Fetch exams, faculty, and rooms
      const [exams] = await query('SELECT id, course_id, exam_name, exam_date, start_time, end_time FROM exams ORDER BY id ASC');
      const [faculty] = await query('SELECT id, faculty_code, name, email, department FROM faculty ORDER BY id ASC');
      const [rooms] = await query('SELECT id, room_number, capacity FROM rooms ORDER BY id ASC');

      if (exams.length === 0 || faculty.length === 0 || rooms.length === 0) {
        return { seeded: false, message: 'Insufficient master data to seed duties.' };
      }

      // Check if there are seat allocations to pair with duties
      const [allocRooms] = await query(`
        SELECT DISTINCT exam_id, room_id 
        FROM seat_allocations 
        ORDER BY exam_id ASC, room_id ASC
      `);

      const seededDuties = [];
      let facIndex = 0;

      if (allocRooms.length > 0) {
        // Create duties matching actual room allocations
        for (const pair of allocRooms) {
          const fac = faculty[facIndex % faculty.length];
          facIndex++;

          await query(
            `INSERT INTO invigilation_duties (exam_id, room_id, faculty_id, status)
             VALUES (?, ?, ?, 'CONFIRMED')
             ON DUPLICATE KEY UPDATE status = VALUES(status)`,
            [pair.exam_id, pair.room_id, fac.id]
          );
          seededDuties.push({ exam_id: pair.exam_id, room_id: pair.room_id, faculty_id: fac.id });
        }
      } else {
        // Fallback: assign first room to each exam
        for (let i = 0; i < exams.length; i++) {
          const ex = exams[i];
          const rm = rooms[i % rooms.length];
          const fac = faculty[i % faculty.length];

          await query(
            `INSERT INTO invigilation_duties (exam_id, room_id, faculty_id, status)
             VALUES (?, ?, ?, 'CONFIRMED')
             ON DUPLICATE KEY UPDATE status = VALUES(status)`,
            [ex.id, rm.id, fac.id]
          );
          seededDuties.push({ exam_id: ex.id, room_id: rm.id, faculty_id: fac.id });
        }
      }

      return { seeded: true, count: seededDuties.length };
    } catch (err) {
      console.warn('Duty seed notice:', err.message);
      return { seeded: false, error: err.message };
    }
  }

  /**
   * Get all duties for a given faculty member (or all duties for admin)
   */
  async getDutiesForFaculty(facultyId = null, userRole = 'FACULTY') {
    let sql = `
      SELECT id.id, id.exam_id, id.room_id, id.faculty_id, id.status AS duty_status, id.status, id.created_at,
             e.exam_name, e.exam_type, e.exam_date, e.start_time, e.end_time, e.duration_minutes,
             c.id AS course_id, c.course_code, c.course_name, c.department AS course_department, c.department AS course_dept, c.semester,
             r.room_number, r.building, r.capacity, r.capacity AS room_capacity, r.rows_count, r.cols_count,
             f.faculty_code, f.name AS faculty_name, f.email AS faculty_email, f.department AS faculty_department, f.designation,
             (SELECT COUNT(*) FROM seat_allocations sa WHERE sa.exam_id = id.exam_id AND sa.room_id = id.room_id) AS allocated_students_count,
             (SELECT COUNT(*) FROM attendance att WHERE att.exam_id = id.exam_id AND att.room_id = id.room_id AND att.status = 'PRESENT') AS present_count,
             (SELECT COUNT(*) FROM attendance att WHERE att.exam_id = id.exam_id AND att.room_id = id.room_id AND att.status = 'ABSENT') AS absent_count,
             (SELECT COUNT(*) FROM attendance att WHERE att.exam_id = id.exam_id AND att.room_id = id.room_id AND att.status = 'FLAGGED') AS flagged_count,
             (SELECT COUNT(*) FROM attendance att WHERE att.exam_id = id.exam_id AND att.room_id = id.room_id AND att.verification_method = 'FACE_MATCH') AS face_verified_count
      FROM invigilation_duties id
      JOIN exams e ON id.exam_id = e.id
      JOIN courses c ON e.course_id = c.id
      JOIN rooms r ON id.room_id = r.id
      JOIN faculty f ON id.faculty_id = f.id
    `;

    const params = [];

    // Filter by faculty unless Admin
    if (userRole !== 'ADMIN' && facultyId) {
      sql += ' WHERE id.faculty_id = ?';
      params.push(facultyId);
    }

    sql += ' ORDER BY e.exam_date ASC, e.start_time ASC, id.id ASC';

    let [duties] = await query(sql, params);

    // Auto-sync duty room with actual seating allocations if an exam's rooms were modified in Step 3
    let needsRefetch = false;
    for (const d of duties) {
      if (Number(d.allocated_students_count) === 0) {
        const [actualRooms] = await query(
          `SELECT sa.room_id, COUNT(*) as cnt 
           FROM seat_allocations sa 
           WHERE sa.exam_id = ? 
           GROUP BY sa.room_id 
           ORDER BY cnt DESC LIMIT 1`,
          [d.exam_id]
        );
        if (actualRooms.length > 0 && actualRooms[0].room_id !== d.room_id) {
          await query('UPDATE invigilation_duties SET room_id = ? WHERE id = ?', [actualRooms[0].room_id, d.id]);
          needsRefetch = true;
        }
      }
    }
    if (needsRefetch) {
      [duties] = await query(sql, params);
    }

    // If this specific faculty member has no duties assigned yet, assign an exam and room specifically to them
    if (duties.length === 0 && userRole !== 'ADMIN' && facultyId) {
      const [exams] = await query('SELECT id FROM exams ORDER BY id ASC');
      const [rooms] = await query('SELECT id FROM rooms ORDER BY id ASC');
      if (exams.length > 0 && rooms.length > 0) {
        const ex = exams[(facultyId - 1) % exams.length];
        const rm = rooms[(facultyId - 1) % rooms.length];
        await query(
          `INSERT INTO invigilation_duties (exam_id, room_id, faculty_id, status)
           VALUES (?, ?, ?, 'CONFIRMED')
           ON DUPLICATE KEY UPDATE faculty_id = VALUES(faculty_id), status = 'CONFIRMED'`,
          [ex.id, rm.id, facultyId]
        );
        const [reFetched] = await query(sql, [facultyId]);
        return reFetched;
      }
    }

    return duties;
  }

  /**
   * Update duty status (e.g. CONFIRMED, ASSIGNED, COMPLETED)
   */
  async updateDutyStatus(dutyId, status) {
    const validStatuses = ['ASSIGNED', 'CONFIRMED', 'ABSENT', 'SUBSTITUTED'];
    if (!validStatuses.includes(status)) {
      const err = new Error(`Invalid duty status. Must be one of: ${validStatuses.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    const [res] = await query('UPDATE invigilation_duties SET status = ? WHERE id = ?', [status, dutyId]);
    if (res.affectedRows === 0) {
      const err = new Error('Duty record not found.');
      err.statusCode = 404;
      throw err;
    }

    return { success: true, dutyId, status };
  }

  /**
   * Get students for a specific duty room and exam, including allocated seat and attendance record
   */
  async getDutyStudents(dutyId, overrideRoomId = null) {
    const [duties] = await query(`
      SELECT id.id, id.exam_id, id.room_id, id.faculty_id, id.status, id.status AS duty_status,
             e.exam_name, e.exam_date, e.start_time, e.end_time,
             c.course_code, c.course_name, c.department AS course_dept, c.department AS course_department,
             r.room_number, r.building, r.capacity, r.capacity AS room_capacity, r.rows_count, r.cols_count
      FROM invigilation_duties id
      JOIN exams e ON id.exam_id = e.id
      JOIN courses c ON e.course_id = c.id
      JOIN rooms r ON id.room_id = r.id
      WHERE id.id = ?
    `, [dutyId]);

    if (duties.length === 0) {
      const err = new Error('Invigilation duty not found.');
      err.statusCode = 404;
      throw err;
    }

    const duty = duties[0];

    // If invigilator selected another allocated hall for this exam session
    if (overrideRoomId && Number(overrideRoomId) !== duty.room_id) {
      const [overrideRooms] = await query('SELECT * FROM rooms WHERE id = ?', [overrideRoomId]);
      if (overrideRooms.length > 0) {
        duty.room_id = overrideRooms[0].id;
        duty.room_number = overrideRooms[0].room_number;
        duty.building = overrideRooms[0].building;
        duty.capacity = overrideRooms[0].capacity;
        duty.room_capacity = overrideRooms[0].capacity;
        duty.rows_count = overrideRooms[0].rows_count;
        duty.cols_count = overrideRooms[0].cols_count;
      }
    }

    // 1. Fetch seat allocations in this room for this exam
    let [students] = await query(`
      SELECT sa.id AS allocation_id, sa.seat_number, sa.row_num, sa.col_num,
             s.id AS student_id, s.enrollment_no, s.name AS student_name, s.email AS student_email,
             s.department AS student_department, s.semester AS student_semester, s.program,
             att.id AS attendance_id, att.status AS attendance_status, att.verification_method,
             att.face_confidence, att.marked_at, att.photo_path
      FROM seat_allocations sa
      JOIN students s ON sa.student_id = s.id
      LEFT JOIN attendance att ON att.exam_id = sa.exam_id AND att.student_id = sa.student_id
      WHERE sa.exam_id = ? AND sa.room_id = ?
      ORDER BY sa.row_num ASC, sa.col_num ASC, LENGTH(s.enrollment_no) ASC, s.enrollment_no ASC
    `, [duty.exam_id, duty.room_id]);

    // 2. If no seat allocations exist in this room, check if exam was allocated to other room(s)
    if (students.length === 0) {
      const [allocatedRooms] = await query(`
        SELECT sa.room_id, r.room_number, r.building, r.capacity, COUNT(*) as cnt
        FROM seat_allocations sa
        JOIN rooms r ON sa.room_id = r.id
        WHERE sa.exam_id = ?
        GROUP BY sa.room_id, r.room_number, r.building, r.capacity
        ORDER BY cnt DESC
      `, [duty.exam_id]);

      if (allocatedRooms.length > 0) {
        // Sync duty to the room where seating was actually generated
        const targetRoom = allocatedRooms[0];
        await query('UPDATE invigilation_duties SET room_id = ? WHERE id = ?', [targetRoom.room_id, dutyId]);
        duty.room_id = targetRoom.room_id;
        duty.room_number = targetRoom.room_number;
        duty.building = targetRoom.building;
        duty.capacity = targetRoom.capacity;
        duty.room_capacity = targetRoom.capacity;

        const [reloaded] = await query(`
          SELECT sa.id AS allocation_id, sa.seat_number, sa.row_num, sa.col_num,
                 s.id AS student_id, s.enrollment_no, s.name AS student_name, s.email AS student_email,
                 s.department AS student_department, s.semester AS student_semester, s.program,
                 att.id AS attendance_id, att.status AS attendance_status, att.verification_method,
                 att.face_confidence, att.marked_at, att.photo_path
          FROM seat_allocations sa
          JOIN students s ON sa.student_id = s.id
          LEFT JOIN attendance att ON att.exam_id = sa.exam_id AND att.student_id = sa.student_id
          WHERE sa.exam_id = ? AND sa.room_id = ?
          ORDER BY sa.row_num ASC, sa.col_num ASC, LENGTH(s.enrollment_no) ASC, s.enrollment_no ASC
        `, [duty.exam_id, targetRoom.room_id]);
        students = reloaded;
      }
    }

    // 3. If STILL no seat allocations exist anywhere for this exam, fallback to enrolled students
    if (students.length === 0) {
      let [fallbackStudents] = await query(`
        SELECT DISTINCT s.id AS student_id, s.enrollment_no, s.name AS student_name, s.email AS student_email,
               s.department AS student_department, s.semester AS student_semester, s.program,
               att.id AS attendance_id, att.status AS attendance_status, att.verification_method,
               att.face_confidence, att.marked_at, att.photo_path
        FROM students s
        JOIN student_courses sc ON s.id = sc.student_id
        JOIN exams e ON e.id = ? AND sc.course_id = e.course_id
        LEFT JOIN attendance att ON att.exam_id = e.id AND att.student_id = s.id
        ORDER BY LENGTH(s.enrollment_no) ASC, s.enrollment_no ASC
        LIMIT ?
      `, [duty.exam_id, duty.capacity || 30]);

      if (fallbackStudents.length === 0) {
        // Fallback by course code in enrolled_courses string OR matching department & semester
        const [fallbackByCode] = await query(`
          SELECT DISTINCT s.id AS student_id, s.enrollment_no, s.name AS student_name, s.email AS student_email,
                 s.department AS student_department, s.semester AS student_semester, s.program,
                 att.id AS attendance_id, att.status AS attendance_status, att.verification_method,
                 att.face_confidence, att.marked_at, att.photo_path
          FROM students s
          JOIN exams e ON e.id = ?
          JOIN courses c ON e.course_id = c.id
          LEFT JOIN attendance att ON att.exam_id = e.id AND att.student_id = s.id
          WHERE (s.enrolled_courses LIKE CONCAT('%', c.course_code, '%')
                 OR (s.department = c.department AND (s.semester = c.semester OR c.semester IS NULL)))
          ORDER BY LENGTH(s.enrollment_no) ASC, s.enrollment_no ASC
          LIMIT ?
        `, [duty.exam_id, duty.capacity || 30]);
        fallbackStudents = fallbackByCode;
      }

      students = fallbackStudents.map((st, idx) => ({
        ...st,
        allocation_id: null,
        seat_number: `${duty.room_number}-R${Math.floor(idx / 6) + 1}-C${(idx % 6) + 1}`,
        row_num: Math.floor(idx / 6) + 1,
        col_num: (idx % 6) + 1
      }));
    }

    // Query all rooms where this exam has allocated seats
    const [examRooms] = await query(`
      SELECT DISTINCT r.id AS room_id, r.room_number, r.building, r.capacity, COUNT(sa.id) AS student_count
      FROM seat_allocations sa
      JOIN rooms r ON sa.room_id = r.id
      WHERE sa.exam_id = ?
      GROUP BY r.id, r.room_number, r.building, r.capacity
      ORDER BY r.room_number ASC
    `, [duty.exam_id]);

    // Compute summary statistics
    const totalStudents = students.length;
    const presentCount = students.filter(s => s.attendance_status === 'PRESENT').length;
    const absentCount = students.filter(s => s.attendance_status === 'ABSENT').length;
    const flaggedCount = students.filter(s => s.attendance_status === 'FLAGGED').length;
    const unverifiedCount = students.filter(s => !s.attendance_status).length;
    const faceVerifiedCount = students.filter(s => !!s.photo_path || s.verification_method === 'FACE_MATCH').length;

    return {
      duty,
      students,
      examRooms: examRooms.length > 0 ? examRooms : [{ room_id: duty.room_id, room_number: duty.room_number, building: duty.building, capacity: duty.capacity, student_count: totalStudents }],
      stats: {
        totalStudents,
        presentCount,
        absentCount,
        flaggedCount,
        unverifiedCount,
        faceVerifiedCount,
        attendanceRate: totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0
      }
    };
  }

  /**
   * Mark individual student attendance (Manual or Face-Match)
   */
  async markAttendance({ exam_id, student_id, room_id, status = 'PRESENT', verification_method = 'MANUAL', face_confidence = null, photo_path = null, photo_base64 = null, userId = null }) {
    if (!exam_id || !student_id || !room_id) {
      const err = new Error('exam_id, student_id, and room_id are required.');
      err.statusCode = 400;
      throw err;
    }

    const validStatuses = ['PRESENT', 'ABSENT', 'FLAGGED'];
    if (!validStatuses.includes(status)) {
      const err = new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    let finalPhotoPath = photo_path;
    const base64Candidate = photo_base64 || (photo_path && typeof photo_path === 'string' && photo_path.startsWith('data:image/') ? photo_path : null);
    if (base64Candidate) {
      finalPhotoPath = this.saveBiometricImage(exam_id, student_id, null, base64Candidate);
    }

    await query(
      `INSERT INTO attendance (exam_id, student_id, room_id, status, verification_method, face_confidence, photo_path, marked_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE
         status = VALUES(status),
         verification_method = VALUES(verification_method),
         face_confidence = VALUES(face_confidence),
         photo_path = IF(VALUES(status) = 'ABSENT', NULL, COALESCE(VALUES(photo_path), photo_path)),
         marked_at = CURRENT_TIMESTAMP`,
      [exam_id, student_id, room_id, status, verification_method, face_confidence, finalPhotoPath]
    );

    // Audit Log
    try {
      await query(
        `INSERT INTO audit_logs (user_id, action, module, details)
         VALUES (?, 'RECORD_ATTENDANCE', 'ATTENDANCE_VERIFICATION', ?)`,
        [
          userId || null,
          `Marked student ID ${student_id} as ${status} in Exam ${exam_id}, Room ${room_id} via ${verification_method}${face_confidence ? ` (${face_confidence}% confidence)` : ''}.`
        ]
      );
    } catch (e) {
      // Ignore non-fatal audit log error
    }

    return {
      success: true,
      exam_id,
      student_id,
      room_id,
      status,
      verification_method,
      face_confidence,
      marked_at: new Date()
    };
  }

  /**
   * Bulk mark remaining unverified students (e.g. Mark All Present / Mark All Absent)
   * Important: NEVER overwrite students who are already marked 'PRESENT'!
   */
  async bulkMarkAttendance({ dutyId, overrideRoomId = null, status = 'ABSENT', verification_method = 'MANUAL', userId = null }) {
    const { duty, students } = await this.getDutyStudents(dutyId, overrideRoomId);

    if (students.length === 0) {
      return { success: true, count: 0, message: 'No students found to mark.' };
    }

    // Only mark students who are NOT already PRESENT (i.e. unverified)
    const targetStudents = students.filter(st => st.attendance_status !== 'PRESENT');

    if (targetStudents.length === 0) {
      return { success: true, count: 0, message: 'All students in this room are already marked Present.' };
    }

    for (const st of targetStudents) {
      await query(
        `INSERT INTO attendance (exam_id, student_id, room_id, status, verification_method, marked_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE
           status = IF(status = 'PRESENT', 'PRESENT', VALUES(status)),
           verification_method = IF(status = 'PRESENT', verification_method, VALUES(verification_method)),
           marked_at = IF(status = 'PRESENT', marked_at, CURRENT_TIMESTAMP)`,
        [duty.exam_id, st.student_id, duty.room_id, status, verification_method]
      );
    }

    try {
      await query(
        `INSERT INTO audit_logs (user_id, action, module, details)
         VALUES (?, 'BULK_ATTENDANCE', 'ATTENDANCE_VERIFICATION', ?)`,
        [
          userId || null,
          `Bulk marked ${targetStudents.length} remaining students as ${status} for Exam ${duty.exam_id}, Room ${duty.room_id}.`
        ]
      );
    } catch (e) {
      // Ignore
    }

    return { success: true, count: targetStudents.length, status };
  }

  /**
   * AI Face Matching Verification Engine (Biometric Simulation)
   * Matches captured webcam image with target student or locates student in roster.
   */
  async verifyFaceMatch({ dutyId, studentId = null, capturedImageBase64 = null, userId = null }) {
    const { duty, students } = await this.getDutyStudents(dutyId);

    if (students.length === 0) {
      const err = new Error('No students found in this classroom roster for face matching.');
      err.statusCode = 404;
      throw err;
    }

    let targetStudent = null;
    if (studentId) {
      targetStudent = students.find(s => s.student_id === parseInt(studentId, 10));
    }

    // If no specific student selected, pick first unverified student or first student
    if (!targetStudent) {
      targetStudent = students.find(s => s.attendance_status !== 'PRESENT') || students[0];
    }

    // High fidelity biometric match simulation:
    // Generate realistic confidence between 93.5% and 99.4%
    const baseConfidence = 94.0;
    const variance = (Math.random() * 5.4).toFixed(1);
    const confidence = parseFloat((baseConfidence + parseFloat(variance)).toFixed(1));

    const isMatch = confidence >= 85.0;

    // Automatically record attendance if match confirmed
    if (isMatch) {
      const savedPhoto = this.saveBiometricImage(
        duty.exam_id,
        targetStudent.student_id,
        targetStudent.student_name,
        capturedImageBase64
      );

      await this.markAttendance({
        exam_id: duty.exam_id,
        student_id: targetStudent.student_id,
        room_id: duty.room_id,
        status: 'PRESENT',
        verification_method: 'FACE_MATCH',
        face_confidence: confidence,
        photo_path: savedPhoto,
        userId
      });
    }

    return {
      success: true,
      isMatch,
      confidence,
      matchResult: isMatch ? 'MATCH_CONFIRMED' : 'MATCH_UNCERTAIN',
      student: {
        id: targetStudent.student_id,
        name: targetStudent.student_name,
        enrollment_no: targetStudent.enrollment_no,
        department: targetStudent.student_department,
        seat_number: targetStudent.seat_number,
        program: targetStudent.program
      },
      room_number: duty.room_number,
      exam_name: duty.exam_name,
      verifiedAt: new Date().toISOString()
    };
  }

  /**
   * Helper: Save real photograph clicked by invigilator to disk (JPG/PNG only, NO random/synthetic images)
   */
  saveBiometricImage(examId, studentId, studentName, capturedImageBase64) {
    if (!capturedImageBase64 || typeof capturedImageBase64 !== 'string' || !capturedImageBase64.startsWith('data:image/')) {
      return null;
    }
    try {
      const attendanceDir = path.join(__dirname, '..', 'uploads', 'attendance');
      if (!fs.existsSync(attendanceDir)) {
        fs.mkdirSync(attendanceDir, { recursive: true });
      }

      const extMatch = capturedImageBase64.match(/^data:image\/([a-zA-Z0-9]+);base64,/);
      const ext = extMatch && extMatch[1] === 'png' ? 'png' : 'jpg';
      const cleanBase64 = capturedImageBase64.replace(/^data:image\/[a-zA-Z0-9]+;base64,/, '');
      const filename = `att_exam${examId}_st${studentId}_${Date.now()}.${ext}`;
      const filePath = path.join(attendanceDir, filename);
      fs.writeFileSync(filePath, Buffer.from(cleanBase64, 'base64'));
      return `/uploads/attendance/${filename}`;
    } catch (err) {
      console.error('Error saving real captured photo:', err);
      return null;
    }
  }

  /**
   * Admin: Get all attendance records across exams and rooms with filtering and KPIs
   */
  async getAllExamAttendance({ examId = null, roomId = null, status = null, method = null, search = null }) {
    // 1. Fetch all exams for filter dropdown
    const [exams] = await query(`
      SELECT e.id, e.exam_name, e.exam_date, e.start_time, e.end_time,
             c.course_code, c.course_name, c.department as course_dept,
             (SELECT COUNT(*) FROM student_courses WHERE course_id = c.id) as enrolled_count
      FROM exams e
      JOIN courses c ON e.course_id = c.id
      ORDER BY e.exam_date ASC, e.id ASC
    `);

    // 2. Fetch all rooms for filter dropdown
    const [rooms] = await query(`
      SELECT id, room_number, building, capacity
      FROM rooms
      ORDER BY room_number ASC
    `);

    // 3. Build dynamic query for student records
    let sql = `
      SELECT 
        e.id AS exam_id,
        e.exam_name,
        e.exam_date,
        c.course_code,
        c.course_name,
        s.id AS student_id,
        s.name AS student_name,
        s.enrollment_no,
        s.department AS student_department,
        s.program,
        s.email AS student_email,
        COALESCE(sa.room_id, att.room_id, (SELECT room_id FROM invigilation_duties WHERE exam_id = e.id LIMIT 1), 1) AS room_id,
        COALESCE(r.room_number, (SELECT room_number FROM rooms WHERE id = COALESCE(sa.room_id, att.room_id, (SELECT room_id FROM invigilation_duties WHERE exam_id = e.id LIMIT 1), 1)), 'Room 101') AS room_number,
        COALESCE(sa.seat_number, CONCAT('S-', s.id)) AS seat_number,
        sa.row_num,
        sa.col_num,
        att.id AS attendance_id,
        COALESCE(att.status, 'UNVERIFIED') AS attendance_status,
        att.verification_method,
        att.face_confidence,
        att.photo_path,
        att.marked_at
      FROM exams e
      JOIN courses c ON e.course_id = c.id
      JOIN student_courses sc ON sc.course_id = c.id
      JOIN students s ON sc.student_id = s.id
      LEFT JOIN seat_allocations sa ON sa.student_id = s.id AND sa.exam_id = e.id
      LEFT JOIN attendance att ON att.student_id = s.id AND att.exam_id = e.id
      LEFT JOIN rooms r ON r.id = COALESCE(sa.room_id, att.room_id)
      WHERE 1=1
    `;

    const params = [];

    if (examId && examId !== 'ALL') {
      sql += ' AND e.id = ?';
      params.push(examId);
    }

    if (roomId && roomId !== 'ALL') {
      sql += ' AND (sa.room_id = ? OR att.room_id = ?)';
      params.push(roomId, roomId);
    }

    if (status && status !== 'ALL') {
      if (status === 'UNVERIFIED') {
        sql += ' AND (att.status IS NULL OR att.status = "UNVERIFIED")';
      } else {
        sql += ' AND att.status = ?';
        params.push(status);
      }
    }

    if (method && method !== 'ALL') {
      sql += ' AND att.verification_method = ?';
      params.push(method);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ' AND (s.name LIKE ? OR s.enrollment_no LIKE ? OR sa.seat_number LIKE ? OR r.room_number LIKE ? OR c.course_code LIKE ?)';
      params.push(term, term, term, term, term);
    }

    sql += ' ORDER BY e.id ASC, r.room_number ASC, sa.row_num ASC, sa.col_num ASC, LENGTH(s.enrollment_no) ASC, s.enrollment_no ASC';

    const [records] = await query(sql, params);

    // Compute stats
    const totalRegistrations = records.length;
    const uniqueStudentSet = new Set(records.map(r => r.student_id));
    const uniqueStudents = uniqueStudentSet.size;

    const presentCount = records.filter(r => r.attendance_status === 'PRESENT').length;
    const absentCount = records.filter(r => r.attendance_status === 'ABSENT').length;
    const flaggedCount = records.filter(r => r.attendance_status === 'FLAGGED').length;
    const unverifiedCount = records.filter(r => r.attendance_status === 'UNVERIFIED').length;
    const faceVerifiedCount = records.filter(r => !!r.photo_path || r.verification_method === 'FACE_MATCH').length;
    const attendanceRate = totalRegistrations > 0 ? Math.round((presentCount / totalRegistrations) * 100) : 0;

    return {
      exams,
      rooms,
      records,
      stats: {
        totalStudents: totalRegistrations,
        totalRegistrations,
        uniqueStudents,
        presentCount,
        absentCount,
        flaggedCount,
        unverifiedCount,
        faceVerifiedCount,
        attendanceRate
      }
    };
  }

  /**
   * Reset attendance records for a duty room
   */
  async resetAttendance(dutyId, userId = null) {
    const [duties] = await query('SELECT exam_id, room_id FROM invigilation_duties WHERE id = ?', [dutyId]);
    if (duties.length === 0) {
      const err = new Error('Duty not found.');
      err.statusCode = 404;
      throw err;
    }

    const { exam_id, room_id } = duties[0];
    const [res] = await query('DELETE FROM attendance WHERE exam_id = ? AND room_id = ?', [exam_id, room_id]);

    try {
      await query(
        `INSERT INTO audit_logs (user_id, action, module, details)
         VALUES (?, 'RESET_ATTENDANCE', 'ATTENDANCE_VERIFICATION', ?)`,
        [userId || null, `Reset attendance for Exam ${exam_id}, Room ${room_id}. Affected rows: ${res.affectedRows}`]
      );
    } catch (e) {
      // Ignore
    }

    return { success: true, clearedCount: res.affectedRows };
  }
}

module.exports = new InvigilatorService();
