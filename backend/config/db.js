const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Create a connection pool to MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'examsphere_db',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test Database Connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(` MySQL Connected to database '${process.env.DB_NAME || 'examsphere_db'}' successfully.`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL Connection Failed:', error.message);
    console.warn('⚠️  Make sure MySQL is running and the database "examsphere_db" is created.');
    return false;
  }
}

module.exports = {
  pool,
  query: (sql, params) => pool.execute(sql, params),
  testConnection
};
