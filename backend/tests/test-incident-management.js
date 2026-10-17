const assert = require('assert');
const incidentService = require('../services/incidentService');

async function runIncidentTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING MODULE 8 TESTS: EXAM-DAY INCIDENT MANAGEMENT');
  console.log('======================================================\n');

  // Test 1: Submitting a new UFM Malpractice Report with Photo Evidence and Written Statements
  const newReportData = {
    exam_id: 1,
    exam_name: 'CSE3005 Software Engineering End-Term',
    course_code: 'CSE3005',
    student_id: 104,
    student_name: 'Vikas Gupta',
    student_roll: '21BCSE1095',
    student_dept: 'Computer Science & Engineering',
    room_id: 1,
    room_number: 'E2-101',
    desk_number: 'Row 4, Desk 18',
    invigilator_id: 2,
    invigilator_name: 'Dr. Nishtha Phutela',
    invigilator_department: 'CSE',
    incident_date: '2026-11-20',
    incident_time: '11:20 AM',
    incident_type: 'UNAUTHORIZED_NOTES',
    severity: 'HIGH',
    material_confiscated: 'Formulas inscribed on back of student calculator casing.',
    incident_details: 'Student was observed holding calculator upside down and consulting inscribed mathematical syntax.',
    student_statement: 'I wrote the formulas last week during tutorial practice and did not erase them.',
    witness_name: 'Prof. Harsh Taneja (Co-Invigilator)',
    evidence_photo_url: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80'
  };

  const created = await incidentService.createReport(newReportData);
  assert.ok(created.id, 'Report must be assigned an ID');
  assert.ok(created.report_number.startsWith('UFM-2026-'), 'Report number must follow UFM-2026-XXXX format');
  assert.strictEqual(created.status, 'REPORTED', 'Default status must be REPORTED');
  assert.strictEqual(created.student_roll, '21BCSE1095');
  console.log(' [TEST 1 PASSED] UFM Incident Report submitted with docket number, written statements, and photo evidence.');

  // Test 2: Faculty View Filters only their own submitted reports
  const facultyReports = await incidentService.getReportsByFaculty('Dr. Nishtha Phutela', 2);
  assert.ok(facultyReports.length > 0, 'Faculty must be able to retrieve their submitted reports');
  const allBelongToFaculty = facultyReports.every(r => 
    r.invigilator_name.includes('Nishtha') || Number(r.invigilator_id) === 2
  );
  assert.ok(allBelongToFaculty, 'Faculty view must strictly contain their own reports');
  console.log(` [TEST 2 PASSED] Faculty Portal isolation verified: Dr. Nishtha Phutela sees ${facultyReports.length} reports.`);

  // Test 3: Admin Case Adjudication and Official Penalty Enforcement
  const adjudicationPayload = {
    status: 'ACTION_TAKEN',
    penalty_imposed: 'Exam Paper Cancelled & Debarred for 1 Academic Semester',
    committee_remarks: 'Disciplinary Committee verified calculator inscriptions. Physical evidence corroborates statement.',
    resolved_by: 'Dr. Rajesh Goel (Controller of Examinations)'
  };

  const adjudicated = await incidentService.updateReportAction(created.id, adjudicationPayload);
  assert.strictEqual(adjudicated.status, 'ACTION_TAKEN');
  assert.strictEqual(adjudicated.penalty_imposed, adjudicationPayload.penalty_imposed);
  assert.ok(adjudicated.resolved_at !== null, 'Resolution timestamp must be populated on committee action');
  console.log(' [TEST 3 PASSED] Admin Disciplinary Committee Adjudication & Official Penalty Enforcement verified.');

  // Test 4: Disciplinary Analytics & Hall Hotspots Surveillance
  const stats = await incidentService.getIncidentStats();
  assert.ok(stats.total >= 4, 'Stats must include all incidents');
  assert.ok(stats.actionTaken >= 1, 'Action taken count must reflect adjudicated cases');
  assert.ok(typeof stats.roomCounts === 'object', 'Hotspots must be an object of room counts');
  assert.ok(stats.categoryCounts.UNAUTHORIZED_NOTES >= 1, 'Category breakdown must aggregate notes');
  console.log(' [TEST 4 PASSED] Disciplinary Analytics & Hall Hotspots aggregation verified.');

  // Test 5: Verify Exoneration / Dismissal Workflow
  const dismissalPayload = {
    status: 'DISMISSED',
    penalty_imposed: 'Case Dismissed - Candidate Exonerated',
    committee_remarks: 'Inspection revealed innocent scratch paper with no syllabus correlation.',
    resolved_by: 'Dr. Rajesh Goel'
  };
  const dismissed = await incidentService.updateReportAction(created.id, dismissalPayload);
  assert.strictEqual(dismissed.status, 'DISMISSED');
  console.log(' [TEST 5 PASSED] Candidate Exoneration & Committee Case Dismissal verified.');

  console.log('\n======================================================');
  console.log('🎯 RESULT: 5 / 5 MODULE 8 INCIDENT MANAGEMENT TESTS PASSED');
  console.log('======================================================\n');
}

runIncidentTests().catch(err => {
  console.error('❌ Incident Management Test Failed:', err);
  process.exit(1);
});
