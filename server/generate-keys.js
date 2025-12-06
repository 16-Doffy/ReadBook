// Script tạo nhiều keys tự động
require('dotenv').config();
const { dbHelpers } = require('./database');

async function generateKeys() {
  console.log('🔑 Đang tạo keys...\n');

  const keysToGenerate = [
    {
      key_value: 'MONERO_123',
      user_name: 'Admin',
      user_email: 'admin@example.com',
      expires_at: null, // Không hết hạn
    },
    {
      key_value: 'KEY_USER_001',
      user_name: 'User 1',
      user_email: 'user1@example.com',
      expires_at: null,
    },
    {
      key_value: 'KEY_USER_002',
      user_name: 'User 2',
      user_email: 'user2@example.com',
      expires_at: null,
    },
    {
      key_value: 'KEY_USER_003',
      user_name: 'User 3',
      user_email: 'user3@example.com',
      expires_at: null,
    },
    {
      key_value: 'KEY_VIP_001',
      user_name: 'VIP User',
      user_email: 'vip@example.com',
      expires_at: null,
    },
    {
      key_value: 'KEY_TEST_001',
      user_name: 'Test User',
      user_email: 'test@example.com',
      // Key có thời hạn 30 ngày
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const keyData of keysToGenerate) {
    try {
      await dbHelpers.createKey(keyData);
      console.log(`✅ Đã tạo key: ${keyData.key_value} (${keyData.user_name})`);
      successCount++;
    } catch (error) {
      if (error.code === 11000) {
        console.log(`⚠️  Key đã tồn tại: ${keyData.key_value}`);
      } else {
        console.log(`❌ Lỗi tạo key ${keyData.key_value}:`, error.message);
        errorCount++;
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Thành công: ${successCount} keys`);
  console.log(`❌ Lỗi: ${errorCount} keys`);
  console.log('='.repeat(50));

  // Hiển thị danh sách keys
  console.log('\n📋 DANH SÁCH TẤT CẢ KEYS:');
  const allKeys = await dbHelpers.getAllKeys();
  allKeys.forEach((key, index) => {
    console.log(`${index + 1}. ${key.key_value}`);
    console.log(`   User: ${key.user_name || 'N/A'} | Email: ${key.user_email || 'N/A'}`);
    console.log(`   Active: ${key.is_active ? '✅' : '❌'} | Expires: ${key.expires_at || 'Không hết hạn'}`);
    console.log('');
  });

  process.exit(0);
}

// Chờ MongoDB connect
setTimeout(() => {
  generateKeys().catch((error) => {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  });
}, 2000);

