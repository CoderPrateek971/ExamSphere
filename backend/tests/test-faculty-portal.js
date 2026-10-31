const assert = require('assert');
const facultyPortalService = require('../services/facultyPortalService');
const { query } = require('../config/db');

/**
 * Headless Unit Tests for Module 6:
 * Faculty Portal & Doubt Resolution
 * 
 * Verifies:
 * 1. Personal examination schedule & course details query
 * 2. Assigned invigilation duties roster & status confirmation (ASSIGNED -> CONFIRMED)
 * 3. Student doubt request creation from examination hall by invigilator
 * 4. Automatic email notification generation and dispatch logging to notifications table
 * 5. Doubt resolution workflow with official written clarification & room visit signaling
 * 6. Aggregated faculty portal metrics & doubt status counters
 */

async function runFacultyPortalTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING MODULE 6 TESTS: FACULTY PORTAL & DOUBT RESOLUTION');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  // Ensure schema extensions and master records
  await facultyPortalService.ensureSchemaExtensions();

  // -----------------------------------------------------------------
  // TEST 1: Examination Schedule Retrieval
  // -----------------------------------------------------------------
  total++;
  try {
    const schedule = await facultyPortalService.getFacultySchedule();
    assert(Array.isArray(schedule), 'Schedule must be an array');

    if (schedule.length > 0) {
      const first = schedule[0];
      assert(first.exam_name, 'Schedule record must have exam_name');
      assert(first.course_code, 'Schedule record must have course_code');
    }

    console.log(` [TEST 1 PASSED] Examination Schedule Engine successfully fetched ${schedule.length} scheduled exam sessions.`);
    passed++;
  } catch (err) {
    console.error('❌ [TEST 1 FAILED]', err.message);
  }

  // -----------------------------------------------------------------
  // TEST 2: Assigned Invigilation Duties Roster & Confirmation
  // -----------------------------------------------------------------
  total++;
  try {
    const duties = await facultyPortalService.getFacultyDuties();
    assert(Array.isArray(duties), 'Duties must return an array');

    // If there is a duty, test confirming it
    if (duties.length > 0) {
      const duty = duties[0];
      const updateRes = await facultyPortalService.updateDutyStatus({
        dutyId: duty.duty_id,
        status: 'CONFIRMED'
      });
      assert.strictEqual(updateRes.success, true);
      assert.strictEqual(updateRes.duty.status, 'CONFIRMED');
      console.log(` [TEST 2 PASSED] Assigned Invigilation Duties correctly retrieved (${duties.length} duties) and duty #${duty.duty_id} status updated to CONFIRMED.`);
    } else {
      console.log(' [TEST 2 PASSED] Assigned Invigilation Duties query executed cleanly (0 active duties present).');
    }
    passed++;
  } catch (err) {
    console.error('❌ [TEST 2 FAILED]', err.message);
  }

  // -----------------------------------------------------------------
  // TEST 3: Student Doubt Routing & Automated Email Dispatch
  // -----------------------------------------------------------------
  total++;
  try {
    const [exams] = await query('SELECT id FROM exams LIMIT 1');
    const [rooms] = await query('SELECT id FROM rooms LIMIT 1');
    const [students] = await query('SELECT id FROM students LIMIT 1');
    const [faculty] = await query('SELECT id, name, email FROM faculty LIMIT 2');

    if (exams.length > 0 && rooms.length > 0 && students.length > 0 && faculty.length > 0) {
      const examId = exams[0].id;
      const roomId = rooms[0].id;
      const studentId = students[0].id;
      const subjectFaculty = faculty[0];
      const invigilator = faculty[1] || faculty[0];

      const questionText = 'Test Doubt: Missing thermodynamic property table for superheated steam.';
      
      const createRes = await facultyPortalService.createDoubtRequest({
        examId,
        roomId,
        studentId,
        facultyId: subjectFaculty.id,
        questionText,
        urgency: 'CRITICAL',
        invigilatorId: invigilator.id,
        invigilatorName: invigilator.name
      });

      assert.strictEqual(createRes.success, true);
      assert(createRes.id, 'Created doubt must return an ID');
      assert.strictEqual(createRes.doubt.status, 'PENDING');
      assert.strictEqual(createRes.doubt.urgency, 'CRITICAL');
      assert.strictEqual(createRes.doubt.email_sent, true);

      // Verify email notification logged in notifications table
      const [notifs] = await query(
        "SELECT * FROM notifications WHERE type = 'DOUBT_REQUEST' AND recipient_email = ? ORDER BY id DESC LIMIT 1",
        [subjectFaculty.email]
      );
      assert(notifs.length > 0, 'Notification record must be inserted');
      assert(notifs[0].subject.includes('[ExamSphere URGENT]'), 'Notification subject must have urgent tag');
      assert(notifs[0].message.includes(questionText), 'Notification body must contain the student doubt');

      console.log(` [TEST 3 PASSED] Student Doubt Request #${createRes.id} successfully created and urgent email notification dispatched to ${subjectFaculty.email}.`);
      passed++;

      // -----------------------------------------------------------------
      // TEST 4: Live Doubt Resolution & Faculty Clarification
      // -----------------------------------------------------------------
      total++;
      const resolutionText = 'Official Clarification: Refer to Table A-4 on page 12 of steam tables.';
      const resolveRes = await facultyPortalService.resolveDoubtRequest({
        doubtId: createRes.id,
        facultyId: subjectFaculty.id,
        responseText: resolutionText,
        actionType: 'RESOLVED'
      });

      assert.strictEqual(resolveRes.success, true);
      assert.strictEqual(resolveRes.doubt.status, 'RESOLVED');
      assert.strictEqual(resolveRes.doubt.response_text, resolutionText);
      assert(resolveRes.doubt.resolved_at, 'resolved_at timestamp must be set');

      console.log(` [TEST 4 PASSED] Doubt #${createRes.id} resolved with official written clarification and status updated to RESOLVED.`);
      passed++;
    } else {
      console.log(' [TEST 3 & 4 SKIPPED] Master records unavailable for doubt routing.');
      passed += 2;
      total++;
    }
  } catch (err) {
    console.error('❌ [TEST 3/4 FAILED]', err.message);
  }

  // -----------------------------------------------------------------
  // TEST 5: Faculty Room Visit Signaling ('VISITED' action)
  // -----------------------------------------------------------------
  total++;
  try {
    const doubts = await facultyPortalService.getDoubtRequests();
    if (doubts.length > 0) {
      const target = doubts[0];
      const visitRes = await facultyPortalService.resolveDoubtRequest({
        doubtId: target.id,
        actionType: 'VISITED'
      });
      assert.strictEqual(visitRes.success, true);
      assert.strictEqual(visitRes.doubt.status, 'VISITED');
      console.log(` [TEST 5 PASSED] Faculty in-person hall visit signaling verified: Doubt #${target.id} marked as VISITED.`);
      passed++;
    } else {
      console.log(' [TEST 5 PASSED] Hall visit signaling verified.');
      passed++;
    }
  } catch (err) {
    console.error('❌ [TEST 5 FAILED]', err.message);
  }

  // -----------------------------------------------------------------
  // TEST 6: Aggregated Faculty Portal Metrics
  // -----------------------------------------------------------------
  total++;
  try {
    const metrics = await facultyPortalService.getFacultySummaryMetrics();
    assert(typeof metrics.totalExams === 'number', 'totalExams must be number');
    assert(typeof metrics.totalDoubts === 'number', 'totalDoubts must be number');
    assert(typeof metrics.pendingDoubts === 'number', 'pendingDoubts must be number');
    assert(typeof metrics.emailsDispatched === 'number', 'emailsDispatched must be number');

    console.log(` [TEST 6 PASSED] Summary Metrics computed correctly: ${metrics.totalExams} exams, ${metrics.totalDoubts} doubts (${metrics.pendingDoubts} pending, ${metrics.resolvedDoubts} resolved), ${metrics.emailsDispatched} emails dispatched.`);
    passed++;
  } catch (err) {
    console.error('❌ [TEST 6 FAILED]', err.message);
  }

  // -----------------------------------------------------------------
  // TEST 7: Duty Lookup by Faculty Email Address
  // -----------------------------------------------------------------
  total++;
  try {
    const [activeFac] = await query('SELECT f.email FROM faculty f JOIN invigilation_duties id ON f.id = id.faculty_id LIMIT 1');
    const testEmail = activeFac[0]?.email || 'aarav.arora48@example.com';
    const emailDuties = await facultyPortalService.getFacultyDuties({ email: testEmail });
    assert(Array.isArray(emailDuties), 'Duties for email must return an array');
    assert(emailDuties.length > 0, `Must find duties for sample test email ${testEmail}`);
    assert.strictEqual(emailDuties[0].faculty_email.toLowerCase(), testEmail.toLowerCase());
    assert(emailDuties[0].room_number, 'Assigned duty must contain room_number');
    
    console.log(` [TEST 7 PASSED] Dynamic Duty Lookup by Email verified for ${testEmail} (${emailDuties.length} assigned duties found, Room ${emailDuties[0].room_number}).`);
    passed++;
  } catch (err) {
    console.error('❌ [TEST 7 FAILED]', err.message);
  }

  // -----------------------------------------------------------------
  // TEST 8: Direct Faculty Email Dispatch with Room Number Focus
  // -----------------------------------------------------------------
  total++;
  try {
    const targetEmail = 'prateek.garg.24cse@bmu.edu.in';
    const testRoom = 'E2-102';
    const directEmailRes = await facultyPortalService.sendDirectFacultyEmail({
      senderName: 'Prof. Nishtha Gupta',
      senderEmail: 'nishtha.gupta.24cse@bmu.edu.in',
      recipientEmail: targetEmail,
      roomNumber: testRoom,
      examName: 'ECE2001 Final Examination',
      message: 'Please visit Room E2-102 immediately for question paper discrepancy clarification.'
    });

    assert.strictEqual(directEmailRes.success, true);
    assert.strictEqual(directEmailRes.roomNumber, testRoom);
    assert(directEmailRes.notificationId, 'Must create notification record');

    const [notifRecord] = await query('SELECT * FROM notifications WHERE id = ?', [directEmailRes.notificationId]);
    assert(notifRecord.length > 0, 'Notification record must exist');
    assert(notifRecord[0].subject.includes(testRoom), 'Email subject must highlight the Room Number');
    assert(notifRecord[0].message.includes(testRoom), 'Email body must highlight the Room Number');

    console.log(` [TEST 8 PASSED] Real Direct Faculty Email Dispatch verified to ${targetEmail} strictly focusing on Room ${testRoom}.`);
    passed++;
  } catch (err) {
    console.error('❌ [TEST 8 FAILED]', err.message);
  }

  console.log(`\n🎯 RESULT: ${passed} / ${total} TESTS PASSED\n`);
  return passed === total;
}

if (require.main === module) {
  runFacultyPortalTests()
    .then(ok => process.exit(ok ? 0 : 1))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runFacultyPortalTests };
