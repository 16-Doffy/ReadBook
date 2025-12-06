# 🔑 Hướng dẫn quản lý Keys

## Cách 1: Dùng Script (Nhanh nhất)

### Tạo nhiều keys tự động:
```bash
cd server
node generate-keys.js
```

Script sẽ tạo các keys mẫu:
- `MONERO_123` - Admin
- `KEY_USER_001`, `KEY_USER_002`, `KEY_USER_003` - Users
- `KEY_VIP_001` - VIP User
- `KEY_TEST_001` - Test User (có thời hạn 30 ngày)

---

## Cách 2: Dùng API Endpoints

### 1. Xem danh sách tất cả keys:
```bash
GET http://localhost:5000/api/admin/keys
```

### 2. Tạo key mới:
```bash
POST http://localhost:5000/api/admin/keys
Content-Type: application/json

{
  "key_value": "KEY_CUSTOM_001",
  "user_name": "Tên người dùng",
  "user_email": "email@example.com",
  "expires_days": 30  // Optional: số ngày hết hạn
}
```

### 3. Tạo nhiều keys tự động:
```bash
POST http://localhost:5000/api/admin/keys/bulk
Content-Type: application/json

{
  "count": 20,           // Số lượng keys muốn tạo
  "prefix": "KEY",       // Prefix cho key (mặc định: "KEY")
  "expires_days": 90     // Optional: số ngày hết hạn
}
```

Ví dụ: Tạo 20 keys với prefix "VIP":
```json
{
  "count": 20,
  "prefix": "VIP",
  "expires_days": 90
}
```
Sẽ tạo: `VIP_0001`, `VIP_0002`, ..., `VIP_0020`

### 4. Vô hiệu hóa/Kích hoạt key:
```bash
PUT http://localhost:5000/api/admin/keys/:keyId
Content-Type: application/json

{
  "is_active": false  // false = vô hiệu hóa, true = kích hoạt
}
```

### 5. Xóa key:
```bash
DELETE http://localhost:5000/api/admin/keys/:keyId
```

---

## Cách 3: Dùng MongoDB trực tiếp

### Xem keys:
```javascript
// MongoDB Compass hoặc mongosh
use comics_library
db.accesskeys.find()
```

### Tạo key thủ công:
```javascript
db.accesskeys.insertOne({
  key_value: "KEY_MANUAL_001",
  user_name: "Manual User",
  user_email: "manual@example.com",
  is_active: true,
  expires_at: null
})
```

---

## Lưu ý:

⚠️ **Bảo mật:**
- Các API `/api/admin/*` hiện tại chưa có authentication
- Nên thêm authentication (JWT, API key) trước khi deploy production
- Không expose các endpoints này ra ngoài internet

💡 **Tips:**
- Key value phải unique (không trùng)
- Nếu không set `expires_at`, key sẽ không bao giờ hết hạn
- Có thể tạo key với thời hạn để test tính năng expiration

---

## Test nhanh với cURL:

```bash
# Tạo 10 keys
curl -X POST http://localhost:5000/api/admin/keys/bulk \
  -H "Content-Type: application/json" \
  -d '{"count": 10, "prefix": "TEST"}'

# Xem danh sách
curl http://localhost:5000/api/admin/keys
```

