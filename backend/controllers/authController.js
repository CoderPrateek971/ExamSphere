const authService = require('../services/authService');

/**
 * Thin Authentication Controller
 * Only handles HTTP protocol parsing, delegation to AuthService, and standardized status codes
 */
async function register(req, res, next) {
  try {
    const data = await authService.registerUser(req.body);
    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.loginUser(req.body);
    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: result
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
}

async function getMe(req, res, next) {
  try {
    const result = await authService.getUserProfile(req.user.id);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
}

module.exports = {
  register,
  login,
  getMe
};
