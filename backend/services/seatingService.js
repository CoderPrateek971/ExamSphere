const { query } = require('../config/db');
const { computeAntiCheatingScore } = require('../utils/antiCheatingHelper');

/**
 * Service encapsulating business logic for Anti-Cheating Seating Allocation
 * Features:
 * - Multi-course checkerboard interleaving (adjacent seats never share the same course)
 * - Staggered buffer spacing for single-course allocations
 * - Room geometry mapping (rows_count x cols_count)
 * - Anti-cheating integrity score computation
 * - 2D classroom visual grid generator
 */
class SeatingService {
  /**
   * Fetch all rooms with their current allocation counts for an exam
   */
  async getRoomsOverview(examId = null) {
    const [rooms] = await query('SELECT * FROM rooms WHERE is_available = TRUE ORDER BY room_number ASC');
    
    if (!examId) return rooms;

    for (const room of rooms) {
      const [allocations] = await query(
        'SELECT COUNT(*) as count FROM seat_allocations WHERE exam_id = ? AND room_id = ?',
        [examId, room.id]
      );
      room.allocated_count = allocations[0]?.count || 0;
      room.utilization_pct = Math.round((room.allocated_count / room.capacity) * 100);
    }
    return rooms;
  }

  /**
   * Run Anti-Cheating Seating Allocation for a specific exam
   * Automatically pairs with another concurrent exam if available to achieve true multi-course interleaving,
   * or applies staggered checkerboard spacing.
   */
  async allocateSeatingForExam(examId, options = {}) {
    const { roomIds = null, strategy = 'CHECKERBOARD_INTERLEAVE' } = options;

    // Fetch the target exam with course details
    const [exams] = await query(
      `SELECT e.*, c.course_code, c.course_name, c.department, c.semester 
       FROM exams e 
       JOIN courses c ON e.course_id = c.id 
       WHERE e.id = ?`,
      [examId]
    );

    if (!exams.length) {
      const err = new Error(`Exam ID ${examId} not found.`);
      err.statusCode = 404;
      throw err;
    }
    const targetExam = exams[0];

    // Find concurrent exams running on the same date and overlapping time slot to interleave with
    const [concurrentExams] = await query(
      `SELECT e.*, c.course_code, c.course_name, c.department, c.semester 
       FROM exams e 
       JOIN courses c ON e.course_id = c.id 
       WHERE e.id != ? 
         AND e.exam_date = ? 
         AND e.start_time = ?`,
      [examId, targetExam.exam_date, targetExam.start_time]
    );

    // Fetch eligible students for target exam (enrolled in matching department & semester)
    const [targetStudents] = await query(
      `SELECT s.*, ? as exam_id, ? as course_code 
       FROM students s 
       WHERE s.department = ? AND s.semester = ?
       ORDER BY s.enrollment_no ASC`,
      [targetExam.id, targetExam.course_code, targetExam.department, targetExam.semester]
    );

    if (targetStudents.length === 0) {
      const err = new Error(`No students found in ${targetExam.department} Semester ${targetExam.semester} for this exam.`);
      err.statusCode = 400;
      throw err;
    }

    // If concurrent exams exist, also pull secondary students for multi-course interleaving
    let partnerStudents = [];
    let partnerExam = null;
    if (concurrentExams.length > 0 && strategy === 'CHECKERBOARD_INTERLEAVE') {
      partnerExam = concurrentExams[0];
      const [partnerRows] = await query(
        `SELECT s.*, ? as exam_id, ? as course_code 
         FROM students s 
         WHERE s.department = ? AND s.semester = ?
         ORDER BY s.enrollment_no ASC`,
        [partnerExam.id, partnerExam.course_code, partnerExam.department, partnerExam.semester]
      );
      partnerStudents = partnerRows;
    }

    // Select available rooms
    let roomSql = 'SELECT * FROM rooms WHERE is_available = TRUE';
    let roomParams = [];
    if (roomIds && roomIds.length > 0) {
      roomSql += ` AND id IN (${roomIds.map(() => '?').join(',')})`;
      roomParams = roomIds;
    }
    roomSql += ' ORDER BY capacity DESC';
    const [rooms] = await query(roomSql, roomParams);

    if (rooms.length === 0) {
      const err = new Error('No available rooms found for seating allocation.');
      err.statusCode = 400;
      throw err;
    }

    // Clear previous allocations for this exam (and partner exam if co-allocating)
    await query('DELETE FROM seat_allocations WHERE exam_id = ?', [examId]);
    if (partnerExam) {
      await query('DELETE FROM seat_allocations WHERE exam_id = ?', [partnerExam.id]);
    }

    // Prepare student queues
    const queueA = [...targetStudents];
    const queueB = [...partnerStudents];

    const allocatedSeats = [];
    let currentRoomIndex = 0;

    while ((queueA.length > 0 || queueB.length > 0) && currentRoomIndex < rooms.length) {
      const room = rooms[currentRoomIndex];
      const rows = room.rows_count || 5;
      const cols = room.cols_count || 6;

      for (let r = 1; r <= rows; r++) {
        for (let c = 1; c <= cols; c++) {
          if (queueA.length === 0 && queueB.length === 0) break;

          const seatNum = `R${r}-C${c}`;
          const isEvenCell = (r + c) % 2 === 0;

          let studentToPlace = null;

          if (partnerExam && (queueA.length > 0 || queueB.length > 0)) {
            // Anti-Cheating Rule: Multi-course Checkerboard Interleaving
            // Even cells -> Course A; Odd cells -> Course B
            if (isEvenCell) {
              if (queueA.length > 0) studentToPlace = queueA.shift();
              else if (queueB.length > 0) studentToPlace = queueB.shift();
            } else {
              if (queueB.length > 0) studentToPlace = queueB.shift();
              else if (queueA.length > 0) studentToPlace = queueA.shift();
            }
          } else {
            // Single course exam: Anti-cheating staggered spacing
            // Stagger seats: Only place students on alternating cells (checkerboard buffer)
            if (strategy === 'STAGGERED_BUFFER') {
              if (isEvenCell && queueA.length > 0) {
                studentToPlace = queueA.shift();
              }
            } else {
              // Standard sequential with spacing if seats allow
              if (queueA.length > 0) {
                studentToPlace = queueA.shift();
              }
            }
          }

          if (studentToPlace) {
            allocatedSeats.push({
              exam_id: studentToPlace.exam_id,
              room_id: room.id,
              student_id: studentToPlace.id,
              row_num: r,
              col_num: c,
              seat_number: seatNum,
              student_name: studentToPlace.name,
              enrollment_no: studentToPlace.enrollment_no,
              course_code: studentToPlace.course_code
            });
          }
        }
      }
      currentRoomIndex++;
    }

    // Persist allocations in database
    for (const seat of allocatedSeats) {
      await query(
        `INSERT INTO seat_allocations (exam_id, room_id, student_id, row_num, col_num, seat_number) 
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE row_num = VALUES(row_num), col_num = VALUES(col_num), seat_number = VALUES(seat_number)`,
        [seat.exam_id, seat.room_id, seat.student_id, seat.row_num, seat.col_num, seat.seat_number]
      );
    }

    // Calculate Anti-Cheating Integrity Score
    const antiCheatingScore = this.computeAntiCheatingScore(allocatedSeats);

    return {
      success: true,
      examId,
      strategyApplied: partnerExam ? 'MULTI_COURSE_CHECKERBOARD_INTERLEAVED' : strategy,
      coAllocatedWith: partnerExam ? partnerExam.course_code : null,
      totalAllocated: allocatedSeats.length,
      roomsUtilized: new Set(allocatedSeats.map(s => s.room_id)).size,
      antiCheatingScore,
      message: `Allocated ${allocatedSeats.length} seats across ${new Set(allocatedSeats.map(s => s.room_id)).size} rooms with ${antiCheatingScore}% Anti-Cheating Integrity Score.`
    };
  }

  /**
   * Computes mathematical Anti-Cheating Integrity Score based on adjacent neighbor course diversity
   */
  computeAntiCheatingScore(seats) {
    return computeAntiCheatingScore(seats);
  }

  /**
   * Get allocations for an exam grouped by rooms
   */
  async getSeatingByExam(examId) {
    const [rows] = await query(
      `SELECT 
        sa.id, sa.exam_id, sa.room_id, sa.student_id, sa.row_num, sa.col_num, sa.seat_number,
        s.name as student_name, s.enrollment_no, s.department as student_department,
        r.room_number, r.building, r.floor, r.rows_count, r.cols_count, r.capacity,
        c.course_code, c.course_name
       FROM seat_allocations sa
       JOIN students s ON sa.student_id = s.id
       JOIN rooms r ON sa.room_id = r.id
       JOIN exams e ON sa.exam_id = e.id
       JOIN courses c ON e.course_id = c.id
       WHERE sa.exam_id = ?
       ORDER BY r.room_number ASC, sa.row_num ASC, sa.col_num ASC`,
      [examId]
    );

    // Group by room
    const roomsMap = {};
    for (const row of rows) {
      if (!roomsMap[row.room_id]) {
        roomsMap[row.room_id] = {
          room_id: row.room_id,
          room_number: row.room_number,
          building: row.building,
          floor: row.floor,
          capacity: row.capacity,
          rows_count: row.rows_count,
          cols_count: row.cols_count,
          seats: []
        };
      }
      roomsMap[row.room_id].seats.push(row);
    }

    return Object.values(roomsMap);
  }

  /**
   * Generate 2D Classroom Visual Grid (rows x cols) for React UI
   */
  async getRoomSeatingGrid(roomId, examId = null) {
    const [rooms] = await query('SELECT * FROM rooms WHERE id = ?', [roomId]);
    if (!rooms.length) {
      const err = new Error(`Room ID ${roomId} not found.`);
      err.statusCode = 404;
      throw err;
    }
    const room = rooms[0];

    let allocSql = `
      SELECT 
        sa.*,
        s.name as student_name,
        s.enrollment_no,
        s.department as student_dept,
        c.course_code,
        c.course_name,
        c.difficulty_level,
        e.exam_name
      FROM seat_allocations sa
      JOIN students s ON sa.student_id = s.id
      JOIN exams e ON sa.exam_id = e.id
      JOIN courses c ON e.course_id = c.id
      WHERE sa.room_id = ?
    `;
    const params = [roomId];
    if (examId) {
      allocSql += ' AND sa.exam_id = ?';
      params.push(examId);
    }
    const [allocations] = await query(allocSql, params);

    // Build fast lookup map: `row_col` -> seat data
    const map = {};
    for (const a of allocations) {
      map[`${a.row_num}_${a.col_num}`] = a;
    }

    // Build 2D matrix
    const grid = [];
    for (let r = 1; r <= room.rows_count; r++) {
      const rowArr = [];
      for (let c = 1; c <= room.cols_count; c++) {
        const seated = map[`${r}_${c}`] || null;
        rowArr.push({
          row: r,
          col: c,
          seat_number: `R${r}-C${c}`,
          student: seated
        });
      }
      grid.push(rowArr);
    }

    const totalSeats = room.rows_count * room.cols_count;
    const occupiedSeats = allocations.length;
    const antiCheatingScore = this.computeAntiCheatingScore(allocations);

    return {
      room,
      totalSeats,
      occupiedSeats,
      utilizationPct: Math.round((occupiedSeats / totalSeats) * 100),
      antiCheatingScore,
      grid
    };
  }

  /**
   * Clear allocations for an exam
   */
  async clearAllocations(examId) {
    await query('DELETE FROM seat_allocations WHERE exam_id = ?', [examId]);
    return true;
  }
}

module.exports = new SeatingService();
