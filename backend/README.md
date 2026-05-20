# Simple CRM Backend - Pizza 4P's

Express.js REST API kết nối Supabase (PostgreSQL).

## Khởi động

```bash
npm install
npm run dev      # development (nodemon)
npm start        # production
```

Server chạy tại: `http://localhost:5000`

---

## Endpoints

### Health Check

```bash
curl http://localhost:5000/api/health
```

Response:
```json
{
  "success": true,
  "message": "API is running",
  "database": "connected",
  "timestamp": "2026-05-14T07:00:00.000Z"
}
```

---

### GET /api/customers — Lấy tất cả khách hàng

```bash
curl http://localhost:5000/api/customers
```

---

### GET /api/customers/search — Tìm kiếm

```bash
# Tìm theo tên/email/phone
curl "http://localhost:5000/api/customers/search?query=phuc"

# Lọc theo status
curl "http://localhost:5000/api/customers/search?status=active"

# Kết hợp + phân trang
curl "http://localhost:5000/api/customers/search?query=nguyen&status=active&limit=10&offset=0"
```

---

### GET /api/customers/:id — Lấy chi tiết

```bash
curl http://localhost:5000/api/customers/f7b7c789-6be8-4424-9590-45f8c615fe79
```

---

### POST /api/customers — Thêm khách hàng

```bash
curl -X POST http://localhost:5000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nguyễn Văn A",
    "email": "a@example.com",
    "phone": "0901234567",
    "address": "123 Lê Lợi, Đà Nẵng",
    "notes": "Khách VIP"
  }'
```

---

### PUT /api/customers/:id — Cập nhật

```bash
curl -X PUT http://localhost:5000/api/customers/f7b7c789-6be8-4424-9590-45f8c615fe79 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nguyễn Văn A",
    "email": "a@example.com",
    "phone": "0901234567",
    "address": "456 Trần Phú, Đà Nẵng",
    "status": "inactive"
  }'
```

---

### DELETE /api/customers/:id — Xóa (soft delete)

```bash
curl -X DELETE http://localhost:5000/api/customers/f7b7c789-6be8-4424-9590-45f8c615fe79
```

---

## Postman Collection

Import URL vào Postman:

| Method | URL | Body |
|--------|-----|------|
| GET | `{{base_url}}/api/health` | — |
| GET | `{{base_url}}/api/customers` | — |
| GET | `{{base_url}}/api/customers/search?query=` | — |
| GET | `{{base_url}}/api/customers/:id` | — |
| POST | `{{base_url}}/api/customers` | JSON |
| PUT | `{{base_url}}/api/customers/:id` | JSON |
| DELETE | `{{base_url}}/api/customers/:id` | — |

Set variable: `base_url = http://localhost:5000`

---

## Logs

Server tự log mọi request với format:

```
[timestamp] --> METHOD /path          ← request đến
[timestamp] [✓] METHOD /path 200 (5ms)  ← thành công
[timestamp] [✗] METHOD /path 404 (2ms)  ← lỗi
[ERROR] message                          ← lỗi chi tiết
```

---

## Environment Variables (.env)

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
PORT=5000
```
