const { query } = require('../config/db');

/**
 * Helper to record an action into the audit_logs table
 * @param {number|null} userId 
 * @param {string} action 
 * @param {string} module 
 * @param {string} details 
 * @param {string} ipAddress 
 */
async function logAction(userId, action, module, details, ipAddress = null) {
  try {
    await query(
      'INSERT INTO audit_logs (user_id, action, module, details, ip_address) VALUES (?, ?, ?, ?, ?)',
      [userId || null, action, module, details || '', ipAddress || '']
    );
  } catch (error) {
    console.error('Audit logging error:', error.message);
  }
}

/**
 * Express middleware to automatically log route actions
 * @param {string} moduleName 
 * @param {string} actionDescription 
 */
function auditMiddleware(moduleName, actionDescription) {
  return async (req, res, next) => {
    // Let the route execute
    res.on('finish', async () => {
      // Only log successful modifications (POST, PUT, DELETE)
      if (['POST', 'PUT', 'DELETE'].includes(req.method) && res.statusCode < 400) {
        const userId = req.user ? req.user.id : null;
        const details = `${req.method} ${req.originalUrl} - Status: ${res.statusCode}`;
        const ip = req.ip || req.connection.remoteAddress;
        await logAction(userId, actionDescription || req.method, moduleName, details, ip);
      }
    });
    next();
  };
}

module.exports = {
  logAction,
  auditMiddleware
};
