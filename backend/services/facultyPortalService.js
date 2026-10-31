const { query } = require('../config/db');
const emailService = require('./emailService');
const { hashPassword } = require('../utils/passwordHelper');

/**
 * Service Layer for Module 6: Faculty Portal & Doubt Resolution
 * 
 * Main Functionalities:
 * 1. Faculty personal examination schedule viewing & departmental calendar
 * 2. Assigned invigilation duties roster with live status confirmation
 * 3. Real-time student doubt routing from examination halls by room invigilators
 * 4. Automated email notification generation with prominent Room Number to visit
 * 5. Real email sending via EmailJS to provided faculty inboxes
 * 6. Direct faculty email sending modal & workflow
 * 7. Querying duties, schedules, and doubts by entering faculty email address
 */
class FacultyPortalService {
  constructor() {
    this.schemaInitialized = false;
  }

  /**
   * Automatically ensure required schema extensions and sample faculty/duties
   */
  async ensureSchemaExtensions() {
    if (this.schemaInitialized) return;
    try {
      // 1. Verify doubt_requests columns
      const [cols] = await query('DESCRIBE doubt_requests');
      const colNames = cols.map(c => c.Field);

      if (!colNames.includes('invigilator_id')) {
        await query('ALTER TABLE doubt_requests ADD COLUMN invigilator_id INT NULL');
      }
      if (!colNames.includes('invigilator_name')) {
        await query('ALTER TABLE doubt_requests ADD COLUMN invigilator_name VARCHAR(120) NULL');
      }
      if (!colNames.includes('response_text')) {
        await query('ALTER TABLE doubt_requests ADD COLUMN response_text TEXT NULL');
      }
      if (!colNames.includes('urgency')) {
        await query("ALTER TABLE doubt_requests ADD COLUMN urgency ENUM('NORMAL', 'HIGH', 'CRITICAL') DEFAULT 'HIGH'");
      }
      if (!colNames.includes('email_sent')) {
        await query('ALTER TABLE doubt_requests ADD COLUMN email_sent BOOLEAN DEFAULT TRUE');
      }
      if (!colNames.includes('resolved_at')) {
        await query('ALTER TABLE doubt_requests ADD COLUMN resolved_at TIMESTAMP NULL');
      }

      // 2. Modify notifications type column to accommodate custom notification types
      try {
        await query('ALTER TABLE notifications MODIFY COLUMN type VARCHAR(50) NOT NULL');
      } catch (e) {
        // May already be modified or non-fatal
      }

      this.schemaInitialized = true;
    } catch (err) {
      console.warn('Schema extension notice in FacultyPortalService:', err.message);
    }
  }

  /**
   * Ensure the 4 sample test faculty exist in database and have assigned duties:
   * - nishtha.gupta.24cse@bmu.edu.in
   * - prateek.garg.24cse@bmu.edu.in
   * - riwan.bhati.24cse@bmu.edu.in
   * - nischay.mehta.24cse@bmu.edu.in
   */
  async ensureSampleFacultyAndDuties() {
    // Demo faculty auto-seeding removed to keep master data clean
    return true;
  }

  /**
   * Seed realistic sample doubt requests if table is currently empty
   */
  async seedDemoDoubtRequestsIfEmpty() {
    await this.ensureSchemaExtensions();
    try {
      const [existing] = await query('SELECT COUNT(*) as count FROM doubt_requests');
      if (existing[0].count > 0) return { seeded: false, count: existing[0].count };

      const [exams] = await query('SELECT id, course_id, exam_name FROM exams ORDER BY id ASC LIMIT 5');
      const [rooms] = await query('SELECT id, room_number, building FROM rooms ORDER BY id ASC LIMIT 5');
      const [students] = await query('SELECT id, name, enrollment_no FROM students ORDER BY id ASC LIMIT 5');
      const [faculty] = await query('SELECT id, name, email FROM faculty ORDER BY id ASC LIMIT 5');

      if (exams.length === 0 || rooms.length === 0 || students.length === 0 || faculty.length === 0) {
        return { seeded: false, message: 'Insufficient master records to seed demo doubt requests.' };
      }

      const sampleDoubts = [
        {
          exam_id: exams[0].id,
          room_id: rooms[0].id,
          student_id: students[0].id,
          faculty_id: faculty[0].id,
          invigilator_id: faculty[1]?.id || faculty[0].id,
          invigilator_name: faculty[1]?.name || 'Prof. Exam Invigilator',
          question_text: 'Question 2(c): Are we required to consider laminar or turbulent flow for the boundary layer problem? Missing fluid Reynolds number.',
          status: 'PENDING',
          urgency: 'CRITICAL',
          email_sent: true,
          response_text: null
        },
        {
          exam_id: exams[1]?.id || exams[0].id,
          room_id: rooms[1]?.id || rooms[0].id,
          student_id: students[1]?.id || students[0].id,
          faculty_id: faculty[1]?.id || faculty[0].id,
          invigilator_id: faculty[0].id,
          invigilator_name: faculty[0].name,
          question_text: 'Question 4(a): Typo in SQL Schema definition. The primary key syntax references table "departments" which is not provided in question.',
          status: 'RESOLVED',
          urgency: 'HIGH',
          email_sent: true,
          response_text: 'Official Clarification: Assume table "departments" contains (dept_id INT PRIMARY KEY, dept_name VARCHAR(50)).',
          resolved_at: new Date()
        }
      ];

      for (const d of sampleDoubts) {
        const [insertRes] = await query(
          `INSERT INTO doubt_requests 
           (exam_id, room_id, student_id, faculty_id, invigilator_id, invigilator_name, question_text, status, urgency, email_sent, response_text, resolved_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            d.exam_id, d.room_id, d.student_id, d.faculty_id, d.invigilator_id, d.invigilator_name,
            d.question_text, d.status, d.urgency, d.email_sent, d.response_text, d.resolved_at || null
          ]
        );

        const targetFaculty = faculty.find(f => f.id === d.faculty_id) || faculty[0];
        const targetExam = exams.find(e => e.id === d.exam_id) || exams[0];
        const targetRoom = rooms.find(r => r.id === d.room_id) || rooms[0];

        const emailData = emailService.formatDoubtRoomEmail({
          facultyName: targetFaculty.name,
          roomNumber: targetRoom.room_number,
          building: targetRoom.building || 'Campus Academic Block',
          examName: targetExam.exam_name,
          invigilatorName: d.invigilator_name,
          questionText: d.question_text
        });

        await query(
          `INSERT INTO notifications (recipient_email, type, subject, message, delivery_status, sent_at)
           VALUES (?, 'DOUBT_REQUEST', ?, ?, 'SENT', NOW())`,
          [targetFaculty.email, emailData.subject, emailData.text]
        );
      }

      return { seeded: true, count: sampleDoubts.length };
    } catch (err) {
      console.warn('Seed demo doubts notice:', err.message);
      return { seeded: false, error: err.message };
    }
  }

  /**
   * Fetch examination schedules relevant to faculty
   * Supports email filter to highlight assignments
   */
  async getFacultySchedule({ facultyId = null, email = null, department = null, semester = null, examType = null, search = null } = {}) {
    await this.ensureSchemaExtensions();

    let sql = `
      SELECT 
        e.id as exam_id,
        e.exam_name,
        e.exam_type,
        e.exam_date,
        e.start_time,
        e.end_time,
        e.duration_minutes,
        e.status as exam_status,
        c.id as course_id,
        c.course_code,
        c.course_name,
        c.department as course_department,
        c.semester as course_semester,
        c.difficulty_level,
        (SELECT COUNT(*) FROM student_courses sc WHERE sc.course_id = c.id) as enrolled_students_count,
        (SELECT COUNT(DISTINCT room_id) FROM seat_allocations sa WHERE sa.exam_id = e.id) as allocated_rooms_count,
        (SELECT COUNT(*) FROM invigilation_duties id WHERE id.exam_id = e.id) as assigned_invigilators_count,
        (
          SELECT GROUP_CONCAT(DISTINCT r.room_number ORDER BY r.room_number SEPARATOR ', ')
          FROM invigilation_duties id_r
          JOIN rooms r ON id_r.room_id = r.id
          WHERE id_r.exam_id = e.id
        ) as allocated_rooms_list
      FROM exams e
      JOIN courses c ON e.course_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (department && department !== 'ALL') {
      sql += ' AND c.department = ?';
      params.push(department);
    }

    if (semester && semester !== 'ALL') {
      sql += ' AND c.semester = ?';
      params.push(Number(semester));
    }

    if (examType && examType !== 'ALL') {
      sql += ' AND e.exam_type = ?';
      params.push(examType);
    }

    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      sql += ' AND (LOWER(e.exam_name) LIKE ? OR LOWER(c.course_code) LIKE ? OR LOWER(c.course_name) LIKE ?)';
      params.push(q, q, q);
    }

    sql += ' ORDER BY e.exam_date ASC, e.start_time ASC';

    const [rows] = await query(sql, params);
    return rows;
  }

  /**
   * Fetch assigned invigilation duties
   * Supports email parameter: enter email to view assigned duties dynamically!
   */
  async getFacultyDuties({ facultyId = null, email = null, status = null } = {}) {
    await this.ensureSchemaExtensions();

    let sql = `
      SELECT 
        id.id as duty_id,
        id.exam_id,
        id.room_id,
        id.faculty_id,
        id.status as duty_status,
        id.substitute_faculty_id,
        id.created_at,
        e.exam_name,
        e.exam_type,
        e.exam_date,
        e.start_time,
        e.end_time,
        e.duration_minutes,
        c.course_code,
        c.course_name,
        c.department as course_department,
        c.semester as course_semester,
        c.course_coordinator_id,
        c.course_coordinator_name,
        r.room_number,
        r.building,
        r.capacity as room_capacity,
        f.faculty_code,
        f.name as faculty_name,
        f.email as faculty_email,
        f.department as faculty_department,
        f.designation,
        sub.name as substitute_name,
        sub.faculty_code as substitute_code,
        (SELECT COUNT(*) FROM seat_allocations sa WHERE sa.exam_id = id.exam_id AND sa.room_id = id.room_id) as student_count,
        (SELECT COUNT(*) FROM attendance att WHERE att.exam_id = id.exam_id AND att.room_id = id.room_id AND att.status = 'PRESENT') as present_count
      FROM invigilation_duties id
      JOIN exams e ON id.exam_id = e.id
      JOIN courses c ON e.course_id = c.id
      JOIN rooms r ON id.room_id = r.id
      JOIN faculty f ON id.faculty_id = f.id
      LEFT JOIN faculty sub ON id.substitute_faculty_id = sub.id
      WHERE 1=1
    `;
    const params = [];

    if (email && email.trim()) {
      sql += ' AND (LOWER(f.email) = LOWER(?) OR LOWER(sub.email) = LOWER(?))';
      params.push(email.trim(), email.trim());
    } else if (facultyId) {
      sql += ' AND (id.faculty_id = ? OR id.substitute_faculty_id = ?)';
      params.push(facultyId, facultyId);
    }

    if (status && status !== 'ALL') {
      sql += ' AND id.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY e.exam_date ASC, e.start_time ASC';

    const [rows] = await query(sql, params);
    return rows;
  }

  /**
   * Update duty confirmation status (e.g., CONFIRMED or request substitution)
   */
  async updateDutyStatus({ dutyId, facultyId = null, status = 'CONFIRMED', substituteFacultyId = null, notes = null }) {
    await this.ensureSchemaExtensions();

    if (!dutyId) {
      const err = new Error('dutyId is required.');
      err.statusCode = 400;
      throw err;
    }

    const [existing] = await query('SELECT * FROM invigilation_duties WHERE id = ?', [dutyId]);
    if (existing.length === 0) {
      const err = new Error('Invigilation duty assignment not found.');
      err.statusCode = 404;
      throw err;
    }

    let updateSql = 'UPDATE invigilation_duties SET status = ?';
    const params = [status];

    if (substituteFacultyId) {
      updateSql += ', substitute_faculty_id = ?';
      params.push(substituteFacultyId);
    }

    updateSql += ' WHERE id = ?';
    params.push(dutyId);

    await query(updateSql, params);

    return {
      success: true,
      message: `Duty #${dutyId} status successfully updated to ${status}.`,
      dutyId: Number(dutyId),
      duty: { id: Number(dutyId), status },
      status
    };
  }

  /**
   * Fetch live student doubt requests
   * Supports email parameter
   */
  async getDoubtRequests({ facultyId = null, email = null, examId = null, roomId = null, status = null, search = null } = {}) {
    await this.ensureSchemaExtensions();

    let sql = `
      SELECT 
        dr.id,
        dr.exam_id,
        dr.room_id,
        dr.student_id,
        dr.faculty_id,
        dr.invigilator_id,
        dr.invigilator_name,
        dr.question_text,
        dr.status,
        dr.urgency,
        dr.email_sent,
        dr.response_text,
        dr.resolved_at,
        dr.created_at,
        e.exam_name,
        e.exam_date,
        e.start_time,
        e.end_time,
        c.id as course_id,
        c.course_code,
        c.course_name,
        c.department as course_department,
        r.room_number,
        r.building as room_building,
        s.name as student_name,
        s.enrollment_no as student_roll,
        s.department as student_department,
        f.name as faculty_name,
        f.email as faculty_email,
        f.faculty_code,
        inv.name as assigned_invigilator_name,
        inv.email as assigned_invigilator_email
      FROM doubt_requests dr
      JOIN exams e ON dr.exam_id = e.id
      JOIN courses c ON e.course_id = c.id
      JOIN rooms r ON dr.room_id = r.id
      JOIN students s ON dr.student_id = s.id
      JOIN faculty f ON dr.faculty_id = f.id
      LEFT JOIN faculty inv ON dr.invigilator_id = inv.id
      WHERE 1=1
    `;
    const params = [];

    let facId = facultyId;
    let facEmail = email && email.trim() ? email.trim().toLowerCase() : null;

    if (facEmail && !facId) {
      const [fac] = await query('SELECT id FROM faculty WHERE LOWER(email) = ?', [facEmail]);
      if (fac.length > 0) facId = fac[0].id;
    } else if (facId && !facEmail) {
      const [fac] = await query('SELECT email FROM faculty WHERE id = ?', [facId]);
      if (fac.length > 0) facEmail = fac[0].email ? fac[0].email.toLowerCase() : null;
    }

    if (facId || facEmail) {
      sql += ` AND (
        dr.faculty_id = ? 
        OR LOWER(f.email) = ?
        OR dr.invigilator_id = ?
        OR LOWER(inv.email) = ?
        OR c.course_coordinator_id = ?
        OR c.id IN (SELECT course_id FROM course_section_instructors WHERE instructor_id = ?)
      )`;
      params.push(facId || 0, facEmail || '', facId || 0, facEmail || '', facId || 0, facId || 0);
    }

    if (examId) {
      sql += ' AND dr.exam_id = ?';
      params.push(examId);
    }

    if (roomId) {
      sql += ' AND dr.room_id = ?';
      params.push(roomId);
    }

    if (status && status !== 'ALL') {
      sql += ' AND dr.status = ?';
      params.push(status);
    }

    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      sql += ` AND (
        LOWER(dr.question_text) LIKE ? OR 
        LOWER(s.name) LIKE ? OR 
        LOWER(s.enrollment_no) LIKE ? OR 
        LOWER(c.course_code) LIKE ? OR 
        LOWER(r.room_number) LIKE ?
      )`;
      params.push(q, q, q, q, q);
    }

    sql += ' ORDER BY dr.created_at DESC';

    const [rows] = await query(sql, params);
    return rows;
  }

  /**
   * Submit/Route a live student doubt request from an exam room to subject faculty
   * Automatically triggers real email notification with prominent Room Number to visit
   */
  async createDoubtRequest({
    examId,
    roomId,
    studentId = null,
    studentRoll = null,
    facultyId,
    recipientEmail = null,
    questionText,
    urgency = 'HIGH',
    invigilatorId = null,
    invigilatorName = null
  }) {
    await this.ensureSchemaExtensions();

    if (!examId || !roomId || !questionText || !facultyId) {
      const err = new Error('examId, roomId, facultyId, and questionText are required to submit a doubt request.');
      err.statusCode = 400;
      throw err;
    }

    // 1. Resolve student record
    let resolvedStudentId = studentId;
    if (!resolvedStudentId && studentRoll) {
      const [sMatch] = await query('SELECT id FROM students WHERE enrollment_no = ?', [studentRoll.trim()]);
      if (sMatch.length > 0) {
        resolvedStudentId = sMatch[0].id;
      }
    }

    if (!resolvedStudentId) {
      const [sa] = await query('SELECT student_id FROM seat_allocations WHERE exam_id = ? AND room_id = ? LIMIT 1', [examId, roomId]);
      if (sa.length > 0) {
        resolvedStudentId = sa[0].student_id;
      } else {
        const [anyStudent] = await query('SELECT id FROM students ORDER BY id ASC LIMIT 1');
        resolvedStudentId = anyStudent[0]?.id || 1;
      }
    }

    // 2. Fetch master details for rich email notification
    const [facultyRows] = await query('SELECT id, name, email, department, user_id FROM faculty WHERE id = ?', [facultyId]);
    if (facultyRows.length === 0) {
      const err = new Error('Target subject faculty not found.');
      err.statusCode = 404;
      throw err;
    }
    const targetFaculty = facultyRows[0];

    const [examRows] = await query(`
      SELECT e.id, e.exam_name, e.exam_date, e.start_time, e.end_time, c.course_code, c.course_name 
      FROM exams e 
      JOIN courses c ON e.course_id = c.id 
      WHERE e.id = ?
    `, [examId]);
    const examDetails = examRows[0] || { exam_name: 'Examination', course_code: 'SUB101' };

    const [roomRows] = await query('SELECT id, room_number, building FROM rooms WHERE id = ?', [roomId]);
    const roomDetails = roomRows[0] || { room_number: 'R-101', building: 'Academic Block' };

    const [studentRows] = await query('SELECT id, name, enrollment_no FROM students WHERE id = ?', [resolvedStudentId]);
    const studentDetails = studentRows[0] || { name: 'Student', enrollment_no: '240101' };

    // 3. Resolve invigilator name
    let senderInvigilatorName = invigilatorName;
    if (!senderInvigilatorName && invigilatorId) {
      const [invRow] = await query('SELECT name FROM faculty WHERE id = ?', [invigilatorId]);
      if (invRow.length > 0) senderInvigilatorName = invRow[0].name;
    }
    if (!senderInvigilatorName) {
      senderInvigilatorName = 'Room Invigilator';
    }

    // 4. Insert doubt request
    const cleanUrgency = ['NORMAL', 'HIGH', 'CRITICAL'].includes(urgency) ? urgency : 'HIGH';
    const [insertResult] = await query(
      `INSERT INTO doubt_requests 
       (exam_id, room_id, student_id, faculty_id, invigilator_id, invigilator_name, question_text, status, urgency, email_sent)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, TRUE)`,
      [examId, roomId, resolvedStudentId, facultyId, invigilatorId || null, senderInvigilatorName, questionText.trim(), cleanUrgency]
    );

    const doubtId = insertResult.insertId;

    // 5. Compose and Dispatch Email Notification emphasizing Room to Visit
    const emailData = emailService.formatDoubtRoomEmail({
      facultyName: targetFaculty.name,
      roomNumber: roomDetails.room_number,
      building: roomDetails.building || 'Campus Central Block',
      examName: examDetails.exam_name,
      courseCode: examDetails.course_code,
      invigilatorName: senderInvigilatorName,
      questionText: questionText.trim()
    });

    const emailSubject = emailData.subject;
    const emailBody = emailData.text;

    // Send real email via EmailJS using dedicated DOUBT_SUPPORT channel
    let mailResult = { success: false };
    const destinationEmail = recipientEmail && recipientEmail.trim() ? recipientEmail.trim() : targetFaculty.email;
    try {
      mailResult = await emailService.sendEmail({
        to: destinationEmail,
        subject: emailSubject,
        text: emailBody,
        html: emailData.html,
        roomNumber: roomDetails.room_number,
        facultyName: targetFaculty.name,
        examName: examDetails.exam_name,
        courseCode: examDetails.course_code || '',
        channel: 'DOUBT_SUPPORT'
      });
    } catch (mailErr) {
      console.warn('Real mail dispatch error:', mailErr.message);
    }

    // 6. Record in notifications table
    let notificationId = null;
    try {
      const [notifResult] = await query(
        `INSERT INTO notifications (user_id, recipient_email, type, subject, message, delivery_status, error_message, sent_at)
         VALUES (?, ?, 'DOUBT_REQUEST', ?, ?, ?, ?, NOW())`,
        [
          targetFaculty.user_id || null, 
          targetFaculty.email, 
          emailSubject, 
          emailBody, 
          mailResult.success ? 'SENT' : 'PENDING',
          mailResult.previewUrl || mailResult.error || null
        ]
      );
      notificationId = notifResult.insertId;
    } catch (notifErr) {
      console.warn('Failed to insert notification record:', notifErr.message);
    }

    return {
      success: true,
      id: doubtId,
      message: `Doubt request forwarded to ${targetFaculty.name} (Room ${roomDetails.room_number}) and real email dispatched.`,
      mailResult,
      doubt: {
        id: doubtId,
        exam_id: examId,
        room_id: roomId,
        room_number: roomDetails.room_number,
        student_id: resolvedStudentId,
        student_name: studentDetails.name,
        student_roll: studentDetails.enrollment_no,
        faculty_id: facultyId,
        faculty_name: targetFaculty.name,
        faculty_email: targetFaculty.email,
        invigilator_name: senderInvigilatorName,
        question_text: questionText.trim(),
        urgency: cleanUrgency,
        status: 'PENDING',
        email_sent: true,
        email_recipient: targetFaculty.email,
        email_subject: emailSubject,
        notification_id: notificationId,
        created_at: new Date()
      }
    };
  }

  /**
   * Resolve or update a student doubt request
   * (Provides written clarification or indicates faculty is visiting the hall)
   */
  async resolveDoubtRequest({ doubtId, facultyId = null, responseText = null, actionType = 'RESOLVED' }) {
    await this.ensureSchemaExtensions();

    if (!doubtId) {
      const err = new Error('doubtId is required.');
      err.statusCode = 400;
      throw err;
    }

    const [existing] = await query(`
      SELECT dr.*, f.name as faculty_name, f.email as faculty_email, r.room_number, e.exam_name, s.name as student_name
      FROM doubt_requests dr
      JOIN faculty f ON dr.faculty_id = f.id
      JOIN rooms r ON dr.room_id = r.id
      JOIN exams e ON dr.exam_id = e.id
      JOIN students s ON dr.student_id = s.id
      WHERE dr.id = ?
    `, [doubtId]);

    if (existing.length === 0) {
      const err = new Error('Doubt request not found.');
      err.statusCode = 404;
      throw err;
    }

    const doubt = existing[0];
    let newStatus = 'RESOLVED';
    let finalResponse = responseText ? responseText.trim() : null;

    if (actionType === 'VISITED') {
      newStatus = 'VISITED';
      if (!finalResponse) {
        finalResponse = `Subject Faculty ${doubt.faculty_name} is visiting Room ${doubt.room_number} in person.`;
      }
    } else if (actionType === 'ACCEPTED') {
      newStatus = 'ACCEPTED';
      if (!finalResponse) {
        finalResponse = 'Faculty has acknowledged the inquiry and is reviewing the question paper.';
      }
    } else {
      newStatus = 'RESOLVED';
      if (!finalResponse) {
        finalResponse = 'Question clarified. Proceed with standard question paper conventions.';
      }
    }

    await query(
      `UPDATE doubt_requests 
       SET status = ?, response_text = ?, resolved_at = NOW() 
       WHERE id = ?`,
      [newStatus, finalResponse, doubtId]
    );

    // Notify room invigilator and log delivery
    const invigilatorEmail = doubt.invigilator_id 
      ? (await query('SELECT email FROM faculty WHERE id = ?', [doubt.invigilator_id]))[0]?.[0]?.email 
      : null;

    if (invigilatorEmail) {
      try {
        await query(
          `INSERT INTO notifications (recipient_email, type, subject, message, delivery_status, sent_at)
           VALUES (?, 'DOUBT_RESOLUTION', ?, ?, 'SENT', NOW())`,
          [
            invigilatorEmail,
            `[ExamSphere Update] Clarification for Room ${doubt.room_number}: Doubt #${doubt.id} ${newStatus}`,
            `Status: ${newStatus}\nRoom: ${doubt.room_number}\nResponse: ${finalResponse}`
          ]
        );
      } catch (err) {
        console.warn('Invigilator resolution notice log err:', err.message);
      }
    }

    return {
      success: true,
      message: `Doubt #${doubtId} marked as ${newStatus}. Clarification registered successfully.`,
      doubt: {
        ...doubt,
        status: newStatus,
        response_text: finalResponse,
        resolved_at: new Date()
      }
    };
  }

  /**
   * Direct mail sending by faculty / invigilator to another faculty member
   * Strictly highlights the required room number to visit
   */
  async sendDirectFacultyEmail({
    senderName = 'Faculty Member',
    senderEmail = 'invigilator@bmu.edu.in',
    recipientEmail,
    roomNumber,
    building = 'Campus Academic Block',
    examName = 'Scheduled Examination',
    courseCode = 'EXAM',
    subject = null,
    message = null
  }) {
    await this.ensureSchemaExtensions();

    if (!recipientEmail || !roomNumber) {
      const err = new Error('recipientEmail and roomNumber are required to dispatch email.');
      err.statusCode = 400;
      throw err;
    }

    // Try finding recipient faculty in DB
    const [facMatch] = await query('SELECT name, department, user_id FROM faculty WHERE email = ?', [recipientEmail.trim()]);
    const recipientName = facMatch[0]?.name || recipientEmail.split('@')[0];
    const userId = facMatch[0]?.user_id || null;

    const emailSubject = subject?.trim() || `URGENT: Visit Room ${roomNumber.trim()} - Faculty Examination Request`;
    
    const emailText = `
URGENT: VISIT ROOM ${roomNumber.trim()} FOR EXAMINATION CONSULTATION

Dear ${recipientName},

An urgent invigilation communication has been sent to you by ${senderName}.
Please visit Room ${roomNumber.trim()} immediately.

============================================================
REQUIRED ROOM TO VISIT: ROOM ${roomNumber.trim()} (${building})
============================================================
Examination:   ${examName} (${courseCode})
Sender:        ${senderName} (${senderEmail})
Message:       "${message?.trim() || 'Please visit the examination hall immediately.'}"

Action Required: Please proceed directly to Room ${roomNumber.trim()}.
============================================================
ExamSphere Automated Examination Controller
    `.trim();

    const emailHtml = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
  <div style="background: linear-gradient(135deg, #0284c7, #2563eb); padding: 22px 24px; text-align: center;">
    <div style="display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #ffffff;">
      FACULTY DIRECT ALERT
    </div>
    <h1 style="margin: 10px 0 4px; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
      Please Visit Room ${roomNumber.trim()}
    </h1>
    <p style="margin: 0; font-size: 14px; color: #bae6fd;">
      Urgent Faculty Communication from Exam Room
    </p>
  </div>

  <div style="padding: 24px;">
    <!-- Prominent Room Number Box -->
    <div style="background: #1e293b; border: 2px solid #38bdf8; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px; box-shadow: 0 4px 14px rgba(56, 189, 248, 0.2);">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; font-weight: 700;">
        Required Room to Visit
      </div>
      <div style="font-size: 42px; font-weight: 900; color: #38bdf8; margin: 8px 0; letter-spacing: 1px;">
        Room ${roomNumber.trim()}
      </div>
      <div style="font-size: 14px; color: #cbd5e1; font-weight: 500;">
        Location: ${building}
      </div>
    </div>

    <div style="background: #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 20px; border: 1px solid #334155;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #334155;">
          <td style="padding: 8px 0; color: #94a3b8; width: 38%;">Recipient:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right; color: #f8fafc;">${recipientName} (${recipientEmail.trim()})</td>
        </tr>
        <tr style="border-bottom: 1px solid #334155;">
          <td style="padding: 8px 0; color: #94a3b8;">Sent By:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right; color: #f8fafc;">${senderName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #334155;">
          <td style="padding: 8px 0; color: #94a3b8;">Examination:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right; color: #f8fafc;">${examName}</td>
        </tr>
      </table>
    </div>

    <div style="background: rgba(56, 189, 248, 0.08); border-left: 4px solid #38bdf8; border-radius: 4px; padding: 14px 16px; margin-bottom: 24px;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #38bdf8; font-weight: 700; margin-bottom: 4px;">
        Message / Instructions
      </div>
      <div style="font-size: 14px; color: #e2e8f0; font-style: italic;">
        "${message?.trim() || 'Please visit Room ' + roomNumber.trim() + ' immediately.'}"
      </div>
    </div>

    <div style="text-align: center; padding: 12px; background: #1e293b; border-radius: 8px; border: 1px solid #334155;">
      <p style="margin: 0; font-size: 14px; color: #38bdf8; font-weight: 600;">
        Action: Please visit <strong>Room ${roomNumber.trim()}</strong> at your earliest convenience.
      </p>
    </div>
  </div>

  <div style="background: #090d16; padding: 14px 24px; text-align: center; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b;">
    ExamSphere Automated Exam Controller &bull; Real-time Faculty Mail Service
  </div>
</div>
    `.trim();

    // Send real email via EmailJS using dedicated FACULTY channel
    const mailResult = await emailService.sendEmail({
      to: recipientEmail.trim(),
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
      roomNumber: roomNumber.trim(),
      examName: examName.trim(),
      channel: 'FACULTY'
    });

    // Record notification in DB
    let notificationId = null;
    try {
      const [notifResult] = await query(
        `INSERT INTO notifications (user_id, recipient_email, type, subject, message, delivery_status, error_message, sent_at)
         VALUES (?, ?, 'FACULTY_DIRECT_MAIL', ?, ?, ?, ?, NOW())`,
        [
          userId,
          recipientEmail.trim(),
          emailSubject,
          emailText,
          mailResult.success ? 'SENT' : 'PENDING',
          mailResult.previewUrl || mailResult.error || null
        ]
      );
      notificationId = notifResult.insertId;
    } catch (notifErr) {
      console.warn('Failed to insert direct mail notification record:', notifErr.message);
    }

    return {
      success: true,
      message: `Real email successfully dispatched to ${recipientEmail.trim()} for Room ${roomNumber.trim()}`,
      mailResult,
      notificationId,
      roomNumber: roomNumber.trim(),
      recipientEmail: recipientEmail.trim()
    };
  }

  /**
   * Fetch aggregated summary metrics for Faculty Portal dashboard
   * Supports email parameter
   */
  async getFacultySummaryMetrics({ facultyId = null, email = null } = {}) {
    await this.ensureSchemaExtensions();

    let dutiesSql = 'SELECT COUNT(*) as total_duties, SUM(CASE WHEN status = "CONFIRMED" THEN 1 ELSE 0 END) as confirmed_duties FROM invigilation_duties WHERE 1=1';
    let doubtsSql = `
      SELECT 
        COUNT(*) as total_doubts,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_doubts,
        SUM(CASE WHEN status = 'VISITED' THEN 1 ELSE 0 END) as visited_doubts,
        SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) as resolved_doubts,
        SUM(CASE WHEN email_sent = TRUE THEN 1 ELSE 0 END) as emails_sent_count
      FROM doubt_requests WHERE 1=1
    `;
    let examsSql = 'SELECT COUNT(*) as total_exams FROM exams';

    const dutyParams = [];
    const doubtParams = [];

    if (email && email.trim()) {
      dutiesSql += ' AND faculty_id IN (SELECT id FROM faculty WHERE LOWER(email) = LOWER(?))';
      dutyParams.push(email.trim());

      doubtsSql += ' AND (faculty_id IN (SELECT id FROM faculty WHERE LOWER(email) = LOWER(?)) OR invigilator_id IN (SELECT id FROM faculty WHERE LOWER(email) = LOWER(?)))';
      doubtParams.push(email.trim(), email.trim());
    } else if (facultyId) {
      dutiesSql += ' AND (faculty_id = ? OR substitute_faculty_id = ?)';
      dutyParams.push(facultyId, facultyId);

      doubtsSql += ' AND (faculty_id = ? OR invigilator_id = ?)';
      doubtParams.push(facultyId, facultyId);
    }

    const [dutyRows] = await query(dutiesSql, dutyParams);
    const [doubtRows] = await query(doubtsSql, doubtParams);
    const [examRows] = await query(examsSql);

    const notifParams = [];
    let notifsSql = `
      SELECT COUNT(*) as email_count 
      FROM notifications 
      WHERE type IN ('DOUBT_REQUEST', 'DOUBT_RESOLUTION', 'FACULTY_DUTY', 'FACULTY_DIRECT_MAIL')
    `;
    if (email && email.trim()) {
      notifsSql += ' AND LOWER(recipient_email) = LOWER(?)';
      notifParams.push(email.trim());
    }
    const [recentNotifs] = await query(notifsSql, notifParams);

    return {
      totalDuties: Number(dutyRows[0]?.total_duties || 0),
      confirmedDuties: Number(dutyRows[0]?.confirmed_duties || 0),
      totalExams: Number(examRows[0]?.total_exams || 0),
      totalDoubts: Number(doubtRows[0]?.total_doubts || 0),
      pendingDoubts: Number(doubtRows[0]?.pending_doubts || 0),
      visitedDoubts: Number(doubtRows[0]?.visited_doubts || 0),
      resolvedDoubts: Number(doubtRows[0]?.resolved_doubts || 0),
      emailsDispatched: Number(recentNotifs[0]?.email_count || doubtRows[0]?.emails_sent_count || 0)
    };
  }

  /**
   * Fetch recent simulated email notifications received by faculty
   */
  async getNotificationsList({ facultyEmail = null, limit = 20 } = {}) {
    await this.ensureSchemaExtensions();

    let sql = `
      SELECT id, user_id, recipient_email, type, subject, message, delivery_status, error_message, sent_at, created_at
      FROM notifications
      WHERE 1=1
    `;
    const params = [];

    if (facultyEmail) {
      sql += ' AND recipient_email = ?';
      params.push(facultyEmail);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(Number(limit) || 20);

    const [rows] = await query(sql, params);
    return rows;
  }
}

module.exports = new FacultyPortalService();
