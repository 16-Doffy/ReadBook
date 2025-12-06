// Script test kết nối MongoDB
require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/comics_library';

console.log('🔍 Đang kiểm tra kết nối MongoDB...');
console.log('📍 URI:', MONGODB_URI);
console.log('');

mongoose.connect(MONGODB_URI).then(() => {
  console.log('✅ Kết nối MongoDB thành công!');
  process.exit(0);
}).catch((err) => {
  console.error('❌ Lỗi kết nối MongoDB:');
  console.error(err.message);
  console.log('');
  console.log('💡 Giải pháp:');
  console.log('   1. Cài MongoDB local: https://www.mongodb.com/try/download/community');
  console.log('   2. Hoặc dùng MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas');
  console.log('   3. Tạo file .env với MONGODB_URI');
  process.exit(1);
});

