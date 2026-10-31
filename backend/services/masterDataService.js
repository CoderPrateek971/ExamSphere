const { query } = require('../config/db');
const { mapDesignationToSeniority } = require('../utils/designationHelper');

/**
 * Service encapsulating business logic & data operations for Master Entities
 * Adheres to Single Responsibility & High Cohesion
 */
class MasterDataService {
  // ===================== STUDENTS =====================
  async getAllStudents() {
    const [rows] = await query(`
      SELECT s.*, 
             COALESCE(GROUP_CONCAT(c.course_code ORDER BY c.course_code SEPARATOR ', '), 'None') AS enrolled_courses
      FROM students s
      LEFT JOIN student_courses sc ON s.id = sc.student_id
      LEFT JOIN courses c ON sc.course_id = c.id
      GROUP BY s.id
      ORDER BY COALESCE(s.import_order, s.id) ASC, s.id ASC
    `);
    return rows;
  }

  async createStudent({ enrollment_no, name, email, department, semester, program, enrolled_courses }) {
    if (!enrollment_no || !name || !email || !department) {
      const err = new Error('enrollment_no, name, email, department are required.');
      err.statusCode = 400;
      throw err;
    }
    const enrolledStr = enrolled_courses || '';
    const [result] = await query(
      'INSERT INTO students (enrollment_no, name, email, department, semester, program, enrolled_courses) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [enrollment_no, name, email, department, semester || 1, program || 'B.Tech', enrolledStr]
    );
    const studentId = result.insertId;
    if (enrolledStr && studentId) {
      const courseCodes = enrolledStr.split(/[,;]+/).map((c) => c.trim().toUpperCase()).filter(Boolean);
      for (const code of courseCodes) {
        let [[course]] = await query('SELECT id FROM courses WHERE UPPER(course_code) = ?', [code]);
        if (course) {
          await query('INSERT IGNORE INTO student_courses (student_id, course_id) VALUES (?, ?)', [studentId, course.id]);
        }
      }
    }
    return studentId;
  }

  async updateStudent(id, { name, email, department, semester, program, enrolled_courses }) {
    await query(
      'UPDATE students SET name = ?, email = ?, department = ?, semester = ?, program = ?, enrolled_courses = COALESCE(?, enrolled_courses) WHERE id = ?',
      [name, email, department, semester, program, enrolled_courses !== undefined ? enrolled_courses : null, id]
    );
    if (enrolled_courses !== undefined) {
      await query('DELETE FROM student_courses WHERE student_id = ?', [id]);
      const courseCodes = (enrolled_courses || '').split(/[,;]+/).map((c) => c.trim().toUpperCase()).filter(Boolean);
      for (const code of courseCodes) {
        let [[course]] = await query('SELECT id FROM courses WHERE UPPER(course_code) = ?', [code]);
        if (course) {
          await query('INSERT IGNORE INTO student_courses (student_id, course_id) VALUES (?, ?)', [id, course.id]);
        }
      }
    }
    return true;
  }

  async deleteStudent(id) {
    await query('DELETE FROM students WHERE id = ?', [id]);
    return true;
  }

  // ===================== FACULTY =====================
  async getAllFaculty() {
    const [rows] = await query('SELECT * FROM faculty ORDER BY name ASC');
    return rows;
  }

  async createFaculty({ faculty_code, name, email, department, designation, seniority_level, max_duties }) {
    if (!faculty_code || !name || !email || !department) {
      const err = new Error('faculty_code, name, email, department are required.');
      err.statusCode = 400;
      throw err;
    }
    const finalDesignation = designation || 'Assistant Professor';
    const finalSeniority = (seniority_level !== undefined && seniority_level !== null && seniority_level !== '' && !isNaN(parseInt(seniority_level, 10)))
      ? parseInt(seniority_level, 10)
      : mapDesignationToSeniority(finalDesignation);

    const [result] = await query(
      'INSERT INTO faculty (faculty_code, name, email, department, designation, seniority_level, max_duties) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [faculty_code, name, email, department, finalDesignation, finalSeniority, max_duties || 5]
    );
    return result.insertId;
  }

  async updateFaculty(id, { name, email, department, designation, seniority_level, max_duties }) {
    const finalDesignation = designation || 'Assistant Professor';
    const finalSeniority = (seniority_level !== undefined && seniority_level !== null && seniority_level !== '' && !isNaN(parseInt(seniority_level, 10)))
      ? parseInt(seniority_level, 10)
      : mapDesignationToSeniority(finalDesignation);

    await query(
      'UPDATE faculty SET name = ?, email = ?, department = ?, designation = ?, seniority_level = ?, max_duties = ? WHERE id = ?',
      [name, email, department, finalDesignation, finalSeniority, max_duties, id]
    );
    return true;
  }

  async deleteFaculty(id) {
    await query('DELETE FROM faculty WHERE id = ?', [id]);
    return true;
  }

  // ===================== COURSES =====================
  async getAllCourses() {
    const [rows] = await query('SELECT * FROM courses ORDER BY course_code ASC');
    return rows;
  }

  async createCourse({ course_code, course_name, department, semester, difficulty_level }) {
    if (!course_code || !course_name || !department) {
      const err = new Error('course_code, course_name, department are required.');
      err.statusCode = 400;
      throw err;
    }
    const [result] = await query(
      'INSERT INTO courses (course_code, course_name, department, semester, difficulty_level) VALUES (?, ?, ?, ?, ?)',
      [course_code, course_name, department, semester || 1, difficulty_level || 3]
    );
    return result.insertId;
  }

  async updateCourse(id, { course_name, department, semester, difficulty_level }) {
    await query(
      'UPDATE courses SET course_name = ?, department = ?, semester = ?, difficulty_level = ? WHERE id = ?',
      [course_name, department, semester, difficulty_level, id]
    );
    return true;
  }

  async deleteCourse(id) {
    await query('DELETE FROM courses WHERE id = ?', [id]);
    return true;
  }

  // ===================== ROOMS =====================
  async getAllRooms() {
    const [rows] = await query('SELECT * FROM rooms ORDER BY room_number ASC');
    return rows;
  }

  async createRoom({ room_number, building, capacity, rows_count, cols_count }) {
    if (!room_number || !building || !capacity) {
      const err = new Error('room_number, building, capacity are required.');
      err.statusCode = 400;
      throw err;
    }
    const rCount = rows_count || 5;
    const cCount = cols_count || Math.ceil(capacity / rCount);

    const [result] = await query(
      'INSERT INTO rooms (room_number, building, capacity, rows_count, cols_count) VALUES (?, ?, ?, ?, ?)',
      [room_number, building, capacity, rCount, cCount]
    );
    return result.insertId;
  }

  async updateRoom(id, { room_number, building, capacity, rows_count, cols_count, is_available }) {
    await query(
      'UPDATE rooms SET room_number = ?, building = ?, capacity = ?, rows_count = ?, cols_count = ?, is_available = ? WHERE id = ?',
      [room_number, building, capacity, rows_count, cols_count, is_available, id]
    );
    return true;
  }

  async deleteRoom(id) {
    await query('DELETE FROM rooms WHERE id = ?', [id]);
    return true;
  }
}

module.exports = new MasterDataService();
