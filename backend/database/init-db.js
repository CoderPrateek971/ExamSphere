const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function initDatabase() {
  console.log('\n======================================================');
  console.log('📦 Initializing ExamSphere MySQL Database...');
  console.log('======================================================\n');

  let connection;
  try {
    // Connect without specifying database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      multipleStatements: true
    });

    console.log(' Connected to MySQL server.');

    // Read schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log(' Executing schema.sql (Creating database, 17 relational tables & Admin seed)...');
    await connection.query(sql);

    console.log(' Database "examsphere_db" initialized successfully with comprehensive BMU schema!');
    console.log(' Default Admin User seeded: admin@examsphere.edu / admin123\n');
    console.log(' (Ready for real spreadsheet ingestion via UI or npm run seed)\n');

    console.log('\n======================================================');
    console.log('🎯 ALL SET! You can now start the backend server:');
    console.log('   npm run dev');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Failed to initialize database:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

initDatabase();
