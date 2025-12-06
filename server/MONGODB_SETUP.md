# Hướng dẫn Setup MongoDB

## Cách 1: MongoDB Local (Cài trên máy)

### Windows:
1. Tải MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Cài đặt và chạy MongoDB service
3. MongoDB sẽ chạy tại: `mongodb://localhost:27017`

### Mac/Linux:
```bash
# Mac (với Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Linux (Ubuntu/Debian)
sudo apt-get install mongodb
sudo systemctl start mongodb
```

## Cách 2: MongoDB Atlas (Cloud - Khuyên dùng)

1. Đăng ký tài khoản: https://www.mongodb.com/cloud/atlas/register
2. Tạo cluster miễn phí
3. Tạo database user
4. Whitelist IP (0.0.0.0/0 để cho phép mọi IP)
5. Lấy connection string:
   - Click "Connect" → "Connect your application"
   - Copy connection string, ví dụ:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/comics_library?retryWrites=true&w=majority
   ```

## Cấu hình

Thêm vào file `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/comics_library
# Hoặc dùng MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/comics_library
```

## Kiểm tra kết nối

Chạy server:
```bash
cd server
npm start
```

Nếu thấy `✅ Connected to MongoDB` là thành công!

## Xem dữ liệu

### Dùng script:
```bash
node view-data.js
```

### Dùng MongoDB Compass:
1. Tải: https://www.mongodb.com/products/compass
2. Kết nối với URI trong `.env`
3. Xem database `comics_library`

### Dùng MongoDB Shell:
```bash
mongosh
use comics_library
db.comics.find()
```

