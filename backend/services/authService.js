const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/passwordHelper');

/**
 * Service handling authentication business logic
 * Completely decoupled from Express req/res (High Cohesion, Testable)
 */
class AuthService {
  /**
   * Register a user with credentials and role
   */
  async registerUser({ name, email, password, role, department, enrollmentNo, facultyCode }) {
    if (!name || !email || !password || !role) {
      const err = new Error('Name, email, password, and role are required.');
      err.statusCode = 400;
      throw err;
    }

    const validRoles = ['ADMIN', 'FACULTY', 'STUDENT'];
    const normalizedRole = role.toUpperCase();
    if (!validRoles.includes(normalizedRole)) {
      const err = new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    // Check duplicate
    const [existing] = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      const err = new Error('A user with this email address already exists.');
      err.statusCode = 409;
      throw err;
    }

    const passwordHash = await hashPassword(password);
    const [insertResult] = await query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, normalizedRole]
    );
    const userId = insertResult.insertId;

    // Synchronize role profile
    if (normalizedRole === 'STUDENT' && enrollmentNo) {
      await query(
        `INSERT INTO students (user_id, enrollment_no, name, email, department) 
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
        [userId, enrollmentNo, name, email, department || 'General']
      );
    } else if (normalizedRole === 'FACULTY' && facultyCode) {
      await query(
        `INSERT INTO faculty (user_id, faculty_code, name, email, department) 
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
        [userId, facultyCode, name, email, department || 'General']
      );
    }

    return { userId, name, email, role: normalizedRole };
  }

  /**
   * Authenticate credentials and generate JWT token
   */
  async loginUser({ email, password }) {
    if (!email || !password) {
      const err = new Error('Email and password are required.');
      err.statusCode = 400;
      throw err;
    }

    const [users] = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      const err = new Error('Invalid credentials. User not found.');
      err.statusCode = 401;
      throw err;
    }

    const user = users[0];
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      const err = new Error('Invalid credentials. Password incorrect.');
      err.statusCode = 401;
      throw err;
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'examsphere_super_secret_jwt_key_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }

  /**
   * Get user profile details
   */
  async getUserProfile(userId) {
    const [users] = await query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      const err = new Error('User profile not found.');
      err.statusCode = 404;
      throw err;
    }

    const user = users[0];
    let extraProfile = null;

    if (user.role === 'STUDENT') {
      const [students] = await query('SELECT * FROM students WHERE user_id = ?', [user.id]);
      extraProfile = students[0] || null;
    } else if (user.role === 'FACULTY') {
      const [faculty] = await query('SELECT * FROM faculty WHERE user_id = ?', [user.id]);
      extraProfile = faculty[0] || null;
    }

    return { user, profile: extraProfile };
  }
}

module.exports = new AuthService();
