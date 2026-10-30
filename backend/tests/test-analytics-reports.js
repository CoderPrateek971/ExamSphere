const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const assert = require('assert');
const analyticsService = require('../services/analyticsService');
const { pool } = require('../config/db');

/**
 * Headless Automated Verification Tests for Module 10:
 * Analytics & Reports (Course Handout TC09 - TC12)
 *
 * TC09: Room Utilization Report (Campus capacity vs allocated seats & utilization %)
 * TC10: Attendance Statistics Report (Present vs absent count & overall attendance rate)
 * TC11: Faculty Workload Report (Professors with assigned duties vs max capacities)
 * TC12: UFM Incident Summary Report (Cheating incident breakdown by status)
 */

async function runAnalyticsTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING MODULE 10: ANALYTICS & REPORTS TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  try {
    // -----------------------------------------------------------------
    // TEST 1 (TC09): Room Utilization Report
    // -----------------------------------------------------------------
    total++;
    try {
      const roomUtil = await analyticsService.getRoomUtilization();
      assert(typeof roomUtil.totalCampusCapacity === 'number', 'totalCampusCapacity should be a number');
      assert(typeof roomUtil.totalAllocatedSeats === 'number', 'totalAllocatedSeats should be a number');
      assert(typeof roomUtil.overallUtilizationRate === 'number', 'overallUtilizationRate should be a number');
      assert(Array.isArray(roomUtil.roomBreakdown), 'roomBreakdown should be an array');

      console.log(`✅ [TC09 PASSED] Room Utilization Report computed successfully.`);
      console.log(`   -> Total Campus Capacity: ${roomUtil.totalCampusCapacity} seats`);
      console.log(`   -> Total Allocated: ${roomUtil.totalAllocatedSeats} seats`);
      console.log(`   -> Overall Campus Utilization: ${roomUtil.overallUtilizationRate}%`);
      console.log(`   -> Rooms evaluated: ${roomUtil.roomBreakdown.length} rooms`);
      passed++;
    } catch (err) {
      console.error(`❌ [TC09 FAILED] Room Utilization error:`, err.message);
    }

    // -----------------------------------------------------------------
    // TEST 2 (TC10): Attendance Statistics Report
    // -----------------------------------------------------------------
    total++;
    try {
      const attStats = await analyticsService.getAttendanceStatistics();
      assert(typeof attStats.totalMarkedAttendance === 'number', 'totalMarkedAttendance should be a number');
      assert(typeof attStats.presentCount === 'number', 'presentCount should be a number');
      assert(typeof attStats.absentCount === 'number', 'absentCount should be a number');
      assert(typeof attStats.attendanceRate === 'number', 'attendanceRate should be a number');
      assert(Array.isArray(attStats.examBreakdown), 'examBreakdown should be an array');

      console.log(`\n✅ [TC10 PASSED] Attendance Statistics Report computed successfully.`);
      console.log(`   -> Present Count: ${attStats.presentCount}`);
      console.log(`   -> Absent Count: ${attStats.absentCount}`);
      console.log(`   -> Overall Attendance Rate: ${attStats.attendanceRate}%`);
      console.log(`   -> Biometric Verified: ${attStats.faceVerifiedCount}`);
      console.log(`   -> Exam breakdown count: ${attStats.examBreakdown.length}`);
      passed++;
    } catch (err) {
      console.error(`❌ [TC10 FAILED] Attendance Statistics error:`, err.message);
    }

    // -----------------------------------------------------------------
    // TEST 3 (TC11): Faculty Workload Report
    // -----------------------------------------------------------------
    total++;
    try {
      const workload = await analyticsService.getFacultyWorkload();
      assert(typeof workload.totalFacultyMembers === 'number', 'totalFacultyMembers should be a number');
      assert(typeof workload.totalDutiesAssigned === 'number', 'totalDutiesAssigned should be a number');
      assert(Array.isArray(workload.facultyRoster), 'facultyRoster should be an array');

      console.log(`\n✅ [TC11 PASSED] Faculty Workload Report computed successfully.`);
      console.log(`   -> Registered Faculty: ${workload.totalFacultyMembers} members`);
      console.log(`   -> Total Assigned Duties: ${workload.totalDutiesAssigned} duties`);
      console.log(`   -> Average Duty Load: ${workload.averageDutiesPerFaculty} sessions/prof`);
      if (workload.facultyRoster.length > 0) {
        const sample = workload.facultyRoster[0];
        console.log(`   -> Sample: ${sample.name} (${sample.facultyCode}) - Assigned: ${sample.assignedDuties}/${sample.maxDuties} (${sample.utilizationRate}%)`);
      }
      passed++;
    } catch (err) {
      console.error(`❌ [TC11 FAILED] Faculty Workload error:`, err.message);
    }

    // -----------------------------------------------------------------
    // TEST 4 (TC12): UFM Incident Summary Report
    // -----------------------------------------------------------------
    total++;
    try {
      const ufm = await analyticsService.getUFMSummary();
      assert(typeof ufm.totalCases === 'number', 'totalCases should be a number');
      assert(typeof ufm.statusBreakdown === 'object', 'statusBreakdown should be an object');
      assert(Array.isArray(ufm.cases), 'cases should be an array');

      console.log(`\n✅ [TC12 PASSED] UFM Incident Summary Report computed successfully.`);
      console.log(`   -> Total UFM Cases: ${ufm.totalCases}`);
      console.log(`   -> Status Breakdown: REPORTED=${ufm.statusBreakdown.REPORTED}, UNDER_REVIEW=${ufm.statusBreakdown.UNDER_REVIEW}, ACTION_TAKEN=${ufm.statusBreakdown.ACTION_TAKEN}, DISMISSED=${ufm.statusBreakdown.DISMISSED}`);
      passed++;
    } catch (err) {
      console.error(`❌ [TC12 FAILED] UFM Summary error:`, err.message);
    }

  } finally {
    console.log('\n======================================================');
    console.log(`🎯 RESULTS: ${passed}/${total} TESTS PASSED`);
    console.log('======================================================\n');
    await pool.end();
  }
}

runAnalyticsTests();
