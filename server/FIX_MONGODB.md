# 🔧 Sửa lỗi MongoDB Connection

## Lỗi hiện tại:
```
Could not connect to any servers in your MongoDB Atlas cluster. 
One common reason is that you're trying to access the database from an IP that isn't whitelisted.
```

## ✅ Cách sửa:

### Bước 1: Whitelist IP trong MongoDB Atlas

1. **Vào MongoDB Atlas Dashboard:**
   - https://cloud.mongodb.com/
   - Đăng nhập vào tài khoản

2. **Vào Network Access:**
   - Click vào project của bạn
   - Vào tab **"Security"** → **"Network Access"**
   - Click nút **"Add IP Address"**

3. **Thêm IP:**
   - **Option A (An toàn):** Thêm IP hiện tại của bạn
     - Click **"Add Current IP Address"**
   - **Option B (Dễ test):** Cho phép tất cả IP
     - Click **"Allow Access from Anywhere"**
     - Hoặc nhập: `0.0.0.0/0`
     - ⚠️ Chỉ dùng cho test, không nên dùng cho production!

4. **Đợi 1-2 phút** để thay đổi có hiệu lực

### Bước 2: Kiểm tra lại

```bash
cd server
node test-connection.js
```

Nếu thấy `✅ Kết nối MongoDB thành công!` là xong!

---

## 🔄 Hoặc dùng MongoDB Local (Nếu đã cài)

Nếu bạn đã cài MongoDB trên máy, sửa file `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/comics_library
```

Sau đó chạy lại:
```bash
node test-connection.js
```

---

## 📝 Lưu ý:

- MongoDB Atlas miễn phí có giới hạn 512MB storage
- Nếu dùng local, đảm bảo MongoDB service đang chạy
- Connection string phải đúng format:
  - Atlas: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`
  - Local: `mongodb://localhost:27017/dbname`

