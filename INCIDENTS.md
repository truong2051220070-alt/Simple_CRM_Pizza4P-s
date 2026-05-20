# Incident Reports - Simple CRM Pizza 4P's

---

## INCIDENT-001: Backend sử dụng MongoDB thay vì Supabase

**Severity:** High  
**Date:** 2026-05-14  
**Status:** Resolved

### Hiện tượng
- Server khởi động log: `[✓] MongoDB connected successfully`
- Khi tạo customer, ID trả về dạng `ObjectId("6a0580136db0c52359c21fd0")` thay vì UUID
- Data tạo qua app không xuất hiện trong Supabase Dashboard
- Supabase Dashboard có 5 records nhưng app hiện 0 customers

### Nguyên nhân
`backend/src/server.js` đang chạy code cũ dùng Mongoose/MongoDB, không phải code Supabase mới.  
File đã được viết lại để dùng Supabase nhưng **chưa được lưu/replace** vào disk — server vẫn load file cũ.

```js
// Code cũ (sai) - vẫn còn trong server.js
const mongoose = require('mongoose');
mongoose.connect(DB_URL, ...)
```

### Cách fix
Thay toàn bộ `server.js` bằng code Supabase:

```js
// Code mới (đúng)
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

Đồng thời xóa `mongoose` khỏi `package.json` và thêm `@supabase/supabase-js`.

---

## INCIDENT-002: Frontend không xóa/sửa được customer — lỗi 404

**Severity:** High  
**Date:** 2026-05-14  
**Status:** Resolved

### Hiện tượng
- Nhấn nút **Delete** → `Error deleting customer: Request failed with status code 404`
- Nhấn nút **Edit** → form điền được nhưng sau khi Submit không cập nhật đúng record
- API backend hoạt động bình thường khi test bằng curl

### Nguyên nhân
Frontend (`App.js`) dùng `customer._id` (MongoDB ObjectId format) để gọi API, nhưng Supabase trả về `customer.id` (UUID format).

```js
// Sai - dùng _id kiểu MongoDB
onClick={() => handleDelete(customer._id)}   // → undefined → /api/customers/undefined → 404
setEditingId(customer._id)                   // → undefined
customers.filter(c => c._id !== id)          // → không filter được
```

Ngoài ra search endpoint cũng sai:
```js
// Sai - URL param kiểu cũ
axios.get(`/api/customers/search/${keyword}`)

// Đúng - query string kiểu Supabase
axios.get(`/api/customers/search?query=${keyword}`)
```

### Cách fix
Thay toàn bộ `_id` → `id` trong `App.js`:

```js
// Đúng
onClick={() => handleDelete(customer.id)}
setEditingId(customer.id)
customers.filter(c => c.id !== id)
customers.map(c => c.id === editingId ? ... : c)
<tr key={customer.id}>
```

---

## INCIDENT-003: Docker build thất bại — nhiều lỗi liên tiếp

**Severity:** Medium  
**Date:** 2026-05-14  
**Status:** Resolved

### Hiện tượng
`docker compose up --build` thất bại với 3 lỗi khác nhau theo thứ tự:

**Lỗi 1:**
```
npm error: The `npm ci` command can only install with an existing package-lock.json
```

**Lỗi 2 (sau khi fix lỗi 1):**
```
Error: Cannot find module '@supabase/supabase-js'
```

**Lỗi 3 (sau khi fix lỗi 2):**
```
Error: Node.js 20 detected without native WebSocket support.
Suggested solution: install "ws" package and provide it via the transport option
```

### Nguyên nhân

**Lỗi 1:** Dockerfile dùng `npm ci` nhưng `backend/package-lock.json` không tồn tại.  
`npm ci` yêu cầu lockfile — không có thì fail ngay.

**Lỗi 2:** `@supabase/supabase-js` không có trong `backend/package.json`.  
`package.json` vẫn còn từ thời MongoDB, chỉ có `mongoose` chứ không có `supabase`.

```json
// Sai - thiếu supabase
"dependencies": {
  "express": "^4.18.2",
  "mongoose": "^7.0.3"
}
```

**Lỗi 3:** `@supabase/supabase-js` v2.x yêu cầu WebSocket. Node.js 18/20-alpine không có native WebSocket flag bật sẵn.

### Cách fix

**Fix lỗi 1:** Đổi `npm ci` → `npm install` trong Dockerfile (hoặc generate `package-lock.json` trước):
```dockerfile
RUN npm install --omit=dev
```

**Fix lỗi 2:** Cập nhật `package.json` — xóa `mongoose`, thêm `@supabase/supabase-js`:
```json
"dependencies": {
  "@supabase/supabase-js": "^2.105.4",
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "dotenv": "^16.0.3",
  "ws": "^8.18.0"
}
```

**Fix lỗi 3:** Cài `ws` package và pass vào `createClient`:
```js
const ws = require('ws');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { transport: ws }
});
```

---

## Tổng kết

| Incident | Severity | Root Cause | Thời gian phát hiện |
|----------|----------|------------|-------------------|
| INCIDENT-001 | High | Sai file server.js (MongoDB vs Supabase) | 2026-05-14 |
| INCIDENT-002 | High | Dùng `_id` MongoDB thay vì `id` UUID Supabase | 2026-05-14 |
| INCIDENT-003 | Medium | Docker config không đồng bộ với dependencies | 2026-05-14 |

**Bài học:**
- Khi đổi database, phải kiểm tra **toàn bộ** code frontend + backend + Docker cùng lúc
- Luôn commit `package-lock.json` vào git để Docker build ổn định
- Test API bằng curl trước khi test qua UI để isolate lỗi
