# 🔄 Quy trình Git cho dự án

## 📝 Các bước push code lên GitHub

### 1. Kiểm tra trạng thái
```bash
git status
```
Xem những file nào đã thay đổi

### 2. Add files vào staging
```bash
# Add tất cả files đã thay đổi
git add .

# Hoặc add từng file cụ thể
git add client/src/App.jsx
git add server/index.js
```

### 3. Commit với message
```bash
git commit -m "Mô tả ngắn gọn về thay đổi"
```

**Ví dụ:**
```bash
git commit -m "Fix login UI và thêm input key cho user"
git commit -m "Update Admin Panel với tính năng cấp key"
git commit -m "Fix CORS error và port configuration"
```

### 4. Push lên GitHub
```bash
git push origin main
```

---

## 🔄 Quy trình đầy đủ (Copy & Paste)

```bash
# 1. Kiểm tra status
git status

# 2. Add files
git add .

# 3. Commit
git commit -m "Mô tả thay đổi của bạn"

# 4. Push
git push origin main
```

---

## 📋 Các lệnh Git hữu ích khác

### Xem lịch sử commit
```bash
git log
```

### Xem sự khác biệt
```bash
git diff
```

### Pull code mới nhất từ GitHub
```bash
git pull origin main
```

### Tạo branch mới
```bash
git checkout -b feature/new-feature
```

### Chuyển về branch main
```bash
git checkout main
```

### Xem các branch
```bash
git branch
```

### Merge branch
```bash
git merge feature/new-feature
```

---

## ⚠️ Lưu ý quan trọng

1. **Luôn check status trước khi commit:**
   ```bash
   git status
   ```

2. **Commit message nên rõ ràng:**
   - ❌ Bad: `git commit -m "fix"`
   - ✅ Good: `git commit -m "Fix login error khi user chưa có key"`

3. **Pull trước khi push (nếu làm việc nhóm):**
   ```bash
   git pull origin main
   git push origin main
   ```

4. **Không commit file nhạy cảm:**
   - `.env` files
   - Passwords, API keys
   - Database files

---

## 🚀 Quick Commands (Copy & Paste)

### Push code mới
```bash
git add . && git commit -m "Update code" && git push origin main
```

### Pull code mới nhất
```bash
git pull origin main
```

### Xem thay đổi chưa commit
```bash
git diff
```

---

## 📚 Tài liệu tham khảo

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)

