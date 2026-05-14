# Incident Management & Debugging Guide

Complete incident documentation with root cause analysis and debugging procedures.

---

## Incident Template

Each incident must document:

1. **Hiện tượng (Symptom)**: What users see/experience
2. **Layer (Layer)**: L4-Frontend, L3-Backend, L2-DB, L1-Infrastructure
3. **Nguyên nhân (Root Cause)**: Why it happened
4. **Cách fix (Solution)**: How to fix it
5. **Cách phòng tránh (Prevention)**: How to avoid it

---

# INCIDENT #1: CORS Error When Frontend Calls Backend API

## 📌 Hiện tượng (Symptom)

**User View:**
- Frontend page loads but buttons don't work
- Console shows red error: `Access to XMLHttpRequest at 'http://localhost:5000/api/customers' from origin 'http://localhost:3001' has been blocked by CORS policy`
- API calls timeout or return 403
- Customer list doesn't load

**When:** When clicking "Add Customer" or page first loads

## 🔍 Layer lỗi (Layer)

**L4: Frontend** ❌ (Frontend code works, but can't reach backend)  
**L3: Backend** ✅ **[ROOT CAUSE HERE]** (Backend not configured for CORS)  
**L2: Database** ✓ (Database is fine, request never reaches it)  
**L1: Infrastructure** ✓ (Docker network is fine)

---

## 🔎 Nguyên nhân (Root Cause)

**Problem:**
```javascript
// ❌ BAD - CORS not configured
const express = require('express');
const app = express();

app.use(express.json());
// Missing CORS middleware!

app.get('/api/customers', (req, res) => {
  // Browser blocks this because CORS not enabled
});
```

**Why:**
- Browser security policy blocks requests across different origins
- Frontend at `http://localhost:3001` cannot call `http://localhost:5000`
- Backend must explicitly allow cross-origin requests
- CORS middleware missing from Express setup

---

## ✅ Cách fix (Solution)

**Fix #1: Install and Configure CORS Middleware**

```bash
npm install cors
```

**Fix #2: Add CORS to Backend**

```javascript
// ✅ GOOD - CORS enabled
const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for all routes
app.use(cors());

// Or configure specific origins
app.use(cors({
  origin: ['http://localhost:3001', 'https://yourdomain.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

app.get('/api/customers', (req, res) => {
  res.json({ success: true });
});
```

**Fix #3: Verify Fix**

```bash
# Restart backend
docker-compose restart backend

# Try API call
curl -X GET http://localhost:5000/api/customers

# Check frontend console (should show data, not error)
```

---

## 🛡️ Cách phòng tránh (Prevention)

1. **Always include CORS in Express setup** (first middleware)
2. **Test locally** with both frontend and backend running
3. **Check browser console** for CORS errors
4. **Use Postman/curl** to test API directly (bypasses CORS)
5. **Configure allowed origins** for production
6. **Document API URL** in `.env.example`

---

---

# INCIDENT #2: 500 Internal Server Error - Database Connection Failed

## 📌 Hiện tượng (Symptom)

**User View:**
- Frontend shows error: "Error loading customers: Error 500"
- Button clicks show loading spinner then fail
- No data displays in customer list
- Refresh page: still broken

**Backend Console Shows:**
```
[✗] MongoDB connection error: connect ECONNREFUSED 127.0.0.1:27017
```

## 🔍 Layer lỗi (Layer)

**L4: Frontend** ✓ (Frontend working, got error response)  
**L3: Backend** ✓ (Backend running, API endpoint works)  
**L2: Database** ❌ **[ROOT CAUSE HERE]** (MongoDB not running/wrong URL)  
**L1: Infrastructure** ✓ (Docker network fine, containers running)

---

## 🔎 Nguyên nhân (Root Cause)

**Problem #1: MongoDB not running**
```bash
# ❌ Issue: Only started backend, forgot mongo
docker-compose up backend

# Result: Backend tries to connect to mongo:27017 but it doesn't exist
# Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Problem #2: Wrong DB_URL in .env**
```env
# ❌ Wrong - localhost doesn't exist in Docker
DB_URL=mongodb://admin:password@localhost:27017/crm-db

# ✅ Correct - use service name
DB_URL=mongodb://admin:password@mongo:27017/crm-db
```

**Problem #3: Database credentials wrong**
```env
# ❌ Wrong username/password
DB_URL=mongodb://admin:wrong_password@mongo:27017/crm-db

# Result: Authentication failed
```

---

## ✅ Cách fix (Solution)

**Option A: Start all services (recommended)**

```bash
# Stop everything
docker-compose down

# Start all services including mongo
docker-compose up --build

# Wait for MongoDB to be healthy (check logs)
docker-compose logs mongo
```

**Option B: Fix DB_URL if only backend is broken**

```bash
# Check docker-compose.yml for service name
# Should be: mongodb://admin:password@mongo:27017/crm-db

# Update backend/.env
DB_URL=mongodb://admin:password@mongo:27017/crm-db?authSource=admin

# Restart backend
docker-compose restart backend
```

**Option C: Verify MongoDB is running**

```bash
# List running containers
docker-compose ps

# Should show mongo is UP and healthy
# If not UP: docker-compose logs mongo

# Connect to MongoDB to verify
mongosh mongodb://admin:password@localhost:27017/admin
```

**Verify Fix:**

```bash
# Backend should now show:
# [✓] MongoDB connected successfully

# Test health endpoint
curl http://localhost:5000/api/health
# Should return: {"status": "ok", ...}
```

---

## 🛡️ Cách phòng tránh (Prevention)

1. **Always run `docker-compose up`** (not single service)
2. **Use service names in DB_URL** (mongo, not localhost)
3. **Check `.env.example`** for correct format
4. **Run `docker-compose logs mongo`** to see MongoDB startup
5. **Test `/api/health`** after restart
6. **Don't hardcode URLs** - use environment variables
7. **Add health checks** to docker-compose.yml (already done)

---

---

# INCIDENT #3: Frontend Shows "undefined" or Blank Data

## 📌 Hiện tượng (Symptom)

**User View:**
- Customer list shows: `[object Object]` or blank
- Customer names/emails missing or show as "undefined"
- Table displays but cells are empty
- No console errors in frontend

**Console shows:**
```
TypeError: Cannot read property 'name' of undefined
```

## 🔍 Layer lỗi (Layer)

**L4: Frontend** ❌ **[ROOT CAUSE HERE]** (Frontend not handling response correctly)  
**L3: Backend** ✓ (API returns correct data)  
**L2: Database** ✓ (Database has data)  
**L1: Infrastructure** ✓ (Everything running)

---

## 🔎 Nguyên nhân (Root Cause)

**Problem #1: Wrong API response structure**

```javascript
// ❌ BAD - accessing wrong field
const customers = response.data.customers;  // Returns undefined
// Because backend returns response.data.data

// ✅ GOOD
const customers = response.data.data;  // Correct!
```

**Problem #2: API_URL hardcoded**

```javascript
// ❌ BAD - hardcoded URL not from env
const API_URL = 'http://localhost:5000';

// ✅ GOOD - from environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

**Problem #3: Missing error handling**

```javascript
// ❌ BAD - crash if API fails
const response = await fetch(API_URL + '/api/customers');
const data = response.json();
setCustomers(data.data);  // Crashes if API down

// ✅ GOOD
try {
  const response = await axios.get(`${API_URL}/api/customers`);
  setCustomers(response.data.data);
} catch (err) {
  setError(err.message);
}
```

---

## ✅ Cách fix (Solution)

**Fix #1: Check API Response Structure**

```bash
# Call API directly to see response
curl http://localhost:5000/api/customers | jq

# You should see:
# {
#   "success": true,
#   "data": [...],  # <-- customers here
#   "count": 0
# }
```

**Fix #2: Update Frontend Code**

```javascript
// App.js - Make sure you access: response.data.data
const fetchCustomers = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/customers`);
    
    // ✅ CORRECT PATH
    setCustomers(response.data.data);  // Not response.data.customers!
    
  } catch (err) {
    setError(err.message);
  }
};
```

**Fix #3: Use Environment Variables**

```javascript
// ✅ GOOD - Uses .env
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// .env file should have:
REACT_APP_API_URL=http://localhost:5000
```

**Fix #4: Check Browser Console**

```bash
# Open Developer Tools (F12)
# Go to Console tab
# Look for red errors

# Should be EMPTY (no errors)
```

**Verify Fix:**

```bash
# Restart frontend
docker-compose restart frontend

# Navigate to http://localhost:3001
# Should see customer list populated
```

---

## 🛡️ Cách phòng tránh (Prevention)

1. **Test API with curl/Postman first** before frontend
2. **Check response structure** in Postman
3. **Use Axios** (handles JSON better than fetch)
4. **Add error handling** to all API calls
5. **Check browser console** after each change
6. **Console.log** API response to debug
7. **Use `.env.example`** for configuration template
8. **Map correct fields**: `response.data.data[0].name`

---

---

## Debugging Checklist

When something breaks, follow this order:

### 1. Check System (L1 - Infrastructure)

```bash
# Are all containers running?
docker-compose ps

# All should show UP
# If not: docker-compose up --build
```

### 2. Check Database (L2)

```bash
# Can you connect?
mongosh mongodb://admin:password@localhost:27017/admin

# See databases
show dbs

# Exit
exit()
```

### 3. Check Backend (L3)

```bash
# Is health check working?
curl http://localhost:5000/api/health

# View logs
docker-compose logs backend

# Look for: [✓] or [✗] messages
```

### 4. Check Frontend (L4)

```bash
# Open http://localhost:3001
# Press F12 (Developer Tools)
# Go to Console tab
# Look for red errors

# Go to Network tab
# See if API calls show 200 (success)
```

### 5. Review .env Files

```bash
# Frontend .env
cat frontend/.env
# Should have: REACT_APP_API_URL=http://localhost:5000

# Backend .env  
cat backend/.env
# Should have: DB_URL=mongodb://admin:password@mongo:27017/crm-db
```

---

## Getting Help

If stuck:

1. **Read error message** carefully
2. **Check logs** with `docker-compose logs`
3. **Test each layer** separately (curl, browser, mongo)
4. **Compare with working version** (check git diff)
5. **Try restart**: `docker-compose down && docker-compose up --build`
6. **Check GitHub Issues** for similar problems
7. **Ask team member** with logs attached

---

**Last Updated:** April 2024  
**Maintained By:** Lê Duy Phước (QA/SRE)
