const mysql = require('mysql2/promise');
require('dotenv').config();

// Tạo connection pool để quản lý kết nối hiệu quả
// Kết nối vào database jwt (đồng bộ với web application)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jwt',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Kiểm tra kết nối database
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Kết nối MySQL thành công!');
    console.log(`📦 Database: ${process.env.DB_NAME || 'jwt'}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Lỗi kết nối MySQL:', error.message);
    return false;
  }
};

// Lấy danh sách các bảng trong database
const getTables = async () => {
  try {
    const [rows] = await pool.execute('SHOW TABLES');
    const tables = rows.map(row => Object.values(row)[0]);
    console.log('📋 Các bảng trong database:', tables.join(', '));
    return tables;
  } catch (error) {
    console.error('❌ Lỗi lấy danh sách bảng:', error.message);
    return [];
  }
};

// Kiểm tra cấu trúc bảng
const describeTable = async (tableName) => {
  try {
    const [rows] = await pool.execute(`DESCRIBE ${tableName}`);
    return rows;
  } catch (error) {
    console.error(`❌ Lỗi describe bảng ${tableName}:`, error.message);
    return [];
  }
};

module.exports = {
  pool,
  testConnection,
  getTables,
  describeTable
};
