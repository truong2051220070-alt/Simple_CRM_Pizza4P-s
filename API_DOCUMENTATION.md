# API Documentation - Simple CRM

Complete API reference for Simple CRM Backend

## Base URL

```
Development: http://localhost:5000
Production: https://your-api-url.com
```

## Authentication

Currently no authentication required (development). For production, implement OAuth2/JWT.

---

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/customers` | Get all customers |
| GET | `/api/customers/:id` | Get customer by ID |
| POST | `/api/customers` | Create customer |
| PUT | `/api/customers/:id` | Update customer |
| DELETE | `/api/customers/:id` | Delete customer |
| GET | `/api/customers/search/:keyword` | Search customers |

---

## Detailed Endpoints

### 1. Health Check

**Endpoint:** `GET /api/health`

**Description:** Verify API is running and healthy

**Request:**
```http
GET /api/health HTTP/1.1
Host: localhost:5000
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "message": "Simple CRM API is healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 456.789
}
```

**Use Case:** Deployment verification, monitoring, load balancer health checks

---

### 2. Get All Customers

**Endpoint:** `GET /api/customers`

**Description:** Retrieve all customers (newest first)

**Query Parameters:** None

**Request:**
```bash
curl -X GET http://localhost:5000/api/customers
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Nguyễn Văn A",
      "email": "nguyena@pizza4p.com",
      "phone": "0123456789",
      "address": "123 Nguyễn Huệ, Đà Nẵng",
      "status": "active",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Trần Thị B",
      "email": "tranb@pizza4p.com",
      "phone": "0987654321",
      "address": "456 Bạch Đằng, Đà Nẵng",
      "status": "inactive",
      "createdAt": "2024-01-14T15:30:00.000Z",
      "updatedAt": "2024-01-14T15:30:00.000Z"
    }
  ],
  "count": 2,
  "message": "Customers retrieved successfully"
}
```

**Response (500 Error):**
```json
{
  "success": false,
  "error": "Database connection error",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### 3. Get Customer by ID

**Endpoint:** `GET /api/customers/:id`

**Description:** Get specific customer details

**Path Parameters:**
- `id` (string, required): MongoDB ObjectId

**Request:**
```bash
curl -X GET http://localhost:5000/api/customers/507f1f77bcf86cd799439011
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Nguyễn Văn A",
    "email": "nguyena@pizza4p.com",
    "phone": "0123456789",
    "address": "123 Nguyễn Huệ, Đà Nẵng",
    "status": "active",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Customer not found"
}
```

---

### 4. Create Customer

**Endpoint:** `POST /api/customers`

**Description:** Create new customer

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Lê Thị C",
  "email": "lethic@pizza4p.com",
  "phone": "0111222333",
  "address": "789 Lý Thái Tông, Đà Nẵng"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Lê Thị C",
    "email": "lethic@pizza4p.com",
    "phone": "0111222333",
    "address": "789 Lý Thái Tông, Đà Nẵng",
    "status": "active",
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  },
  "message": "Customer created successfully"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Name and email are required"
}
```

**Response (400 Duplicate Email):**
```json
{
  "success": false,
  "message": "Email already exists"
}
```

**Validation Rules:**
- `name` (string, required): Customer full name
- `email` (string, required, unique): Valid email address
- `phone` (string, optional): Phone number
- `address` (string, optional): Customer address

---

### 5. Update Customer

**Endpoint:** `PUT /api/customers/:id`

**Description:** Update customer information

**Path Parameters:**
- `id` (string, required): MongoDB ObjectId

**Request Body:**
```json
{
  "name": "Nguyễn Văn A Updated",
  "phone": "0999888777",
  "status": "inactive"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Nguyễn Văn A Updated",
    "email": "nguyena@pizza4p.com",
    "phone": "0999888777",
    "address": "123 Nguyễn Huệ, Đà Nẵng",
    "status": "inactive",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  },
  "message": "Customer updated successfully"
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Customer not found"
}
```

**Updateable Fields:**
- `name`
- `email`
- `phone`
- `address`
- `status`

---

### 6. Delete Customer

**Endpoint:** `DELETE /api/customers/:id`

**Description:** Delete customer from system

**Path Parameters:**
- `id` (string, required): MongoDB ObjectId

**Request:**
```bash
curl -X DELETE http://localhost:5000/api/customers/507f1f77bcf86cd799439011
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Customer deleted successfully"
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Customer not found"
}
```

---

### 7. Search Customers

**Endpoint:** `GET /api/customers/search/:keyword`

**Description:** Search customers by name, email, or phone (case-insensitive)

**Path Parameters:**
- `keyword` (string, required): Search term

**Request:**
```bash
curl -X GET http://localhost:5000/api/customers/search/nguyen
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Nguyễn Văn A",
      "email": "nguyena@pizza4p.com",
      "phone": "0123456789",
      "address": "123 Nguyễn Huệ, Đà Nẵng",
      "status": "active",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "count": 1,
  "keyword": "nguyen"
}
```

**Response (200 No Results):**
```json
{
  "success": true,
  "data": [],
  "count": 0,
  "keyword": "notfound"
}
```

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 500 | Server Error |

---

## Testing with Postman

1. Import the collection from `.postman_collection.json`
2. Set `base_url` variable to `http://localhost:5000`
3. Run requests and test responses

**Or manually:**

```bash
# Health check
curl http://localhost:5000/api/health

# Get all customers
curl http://localhost:5000/api/customers

# Create customer
curl -X POST http://localhost:5000/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com"}'

# Search
curl http://localhost:5000/api/customers/search/test
```

---

## Rate Limiting

Currently no rate limiting. Implement in production using middleware like `express-rate-limit`.

---

## CORS

**Allowed Origins:**
- http://localhost:3001 (development)
- Configure in production

**Allowed Methods:**
- GET, POST, PUT, DELETE, OPTIONS

---

## Data Models

### Customer Schema

```javascript
{
  _id: ObjectId,                    // MongoDB ID
  name: String (required),          // Customer name
  email: String (required, unique), // Email address
  phone: String,                    // Phone number
  address: String,                  // Delivery address
  status: String (active/inactive), // Customer status
  createdAt: Date,                  // Creation timestamp
  updatedAt: Date                   // Last update timestamp
}
```

---

## Logging

All requests are logged with format:
```
[timestamp] METHOD /path
[✓] Success message
[✗] Error message
```

Check Docker logs:
```bash
docker-compose logs backend
```

---

**API Version:** 1.0.0  
**Last Updated:** April 2024  
**Maintained By:** Ông Thân Quốc Trường
