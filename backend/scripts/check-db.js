const { pool, describeTable } = require('../config/database');

async function checkDatabase() {
  try {
    console.log('\n📊 Cấu trúc bảng Users:');
    console.log('========================');
    const usersStructure = await describeTable('Users');
    console.table(usersStructure);

    console.log('\n📊 Cấu trúc bảng Roles:');
    console.log('========================');
    const rolesStructure = await describeTable('Roles');
    console.table(rolesStructure);

    // Lấy một vài users mẫu
    console.log('\n👥 Dữ liệu mẫu từ bảng Users:');
    console.log('========================');
    const [users] = await pool.execute('SELECT id, email, name, role_id, created_at FROM Users LIMIT 3');
    console.table(users);

    process.exit(0);
  } catch (error) {
    console.error('Lỗi:', error.message);
    process.exit(1);
  }
}

checkDatabase();
