const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'myhealthdb-server.mysql.database.azure.com',
  user: process.env.DB_USER || 'mvrmsrginb',
  password: process.env.DB_PASSWORD || '0BmI94GrJ8T$vaAN',
  database: process.env.DB_NAME || 'medbond',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: true // Enforce SSL and verify the server certificate
  }
});

module.exports = pool;