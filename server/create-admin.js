// Script tạo admin user nếu chưa có
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { dbHelpers, User, AccessKey } = require('./database');

async function createAdmin() {
  try {
    console.log('🔍 Đang kiểm tra admin user...');
    
    // Check if admin exists
    const existingAdmin = await dbHelpers.getUserByUsername('admin');
    
    if (existingAdmin) {
      console.log('✅ Admin user đã tồn tại!');
      console.log('   Username: admin');
      console.log('   Email:', existingAdmin.email);
      console.log('   Role:', existingAdmin.role);
      console.log('   Status:', existingAdmin.status);
      
      // Reset password về admin123
      const newPassword = await bcrypt.hash('admin123', 10);
      await dbHelpers.updateUser(existingAdmin._id.toString(), {
        password: newPassword,
        role: 'admin',
        status: 'active',
      });
      console.log('✅ Đã reset password về: admin123');
      
      // Check key
      if (existingAdmin.key_id) {
        const key = await AccessKey.findById(existingAdmin.key_id);
        if (key) {
          console.log('   Key:', key.key_value);
        }
      } else {
        // Create key if not exists
        const adminKeyId = await dbHelpers.createKey({
          key_value: process.env.SECRET_KEY || 'MONERO_123',
          user_name: 'Admin',
          user_email: existingAdmin.email,
          expires_at: null,
          is_active: true,
        });
        await dbHelpers.assignKeyToUser(existingAdmin._id.toString(), adminKeyId);
        console.log('✅ Đã tạo key: MONERO_123');
      }
    } else {
      console.log('📝 Tạo admin user mới...');
      
      const adminPassword = await bcrypt.hash('admin123', 10);
      const adminUser = await dbHelpers.createUser({
        username: 'admin',
        email: 'admin@example.com',
        password: adminPassword,
        full_name: 'Administrator',
        role: 'admin',
        status: 'active',
      });

      const adminKeyId = await dbHelpers.createKey({
        key_value: process.env.SECRET_KEY || 'MONERO_123',
        user_name: 'Admin',
        user_email: 'admin@example.com',
        expires_at: null,
        is_active: true,
      });

      await dbHelpers.assignKeyToUser(adminUser._id.toString(), adminKeyId);

      console.log('✅ Đã tạo admin user thành công!');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('   Key: MONERO_123');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

setTimeout(() => {
  createAdmin();
}, 2000);

