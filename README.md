# Simple CRM - Pizza 4P's

**Customer Management System with Complete DevOps Pipeline**

A full-stack web application for managing customers at Pizza 4P's restaurant chain, featuring React frontend, Node.js backend, MongoDB database, and complete CI/CD pipeline.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Team Members](#team-members)
- [Requirements](#requirements)
- [Project Architecture](#project-architecture)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Docker & DevOps](#docker--devops)
- [CI/CD Pipeline](#cicd-pipeline)
- [Deployment](#deployment)
- [Incident Management](#incident-management)
- [Development Guide](#development-guide)

---

## 👥 Project Overview

**Simple CRM** is a customer relationship management system designed for Pizza 4P's restaurant chain. It provides:

- ✅ **Customer Management**: Add, edit, delete, and search customers
- ✅ **Real-time Updates**: Instant UI refresh with API integration
- ✅ **Responsive Design**: Works on desktop, tablet, and mobile
- ✅ **Production Ready**: Fully containerized with CI/CD pipeline
- ✅ **Monitoring**: Comprehensive logging and health checks
- ✅ **Deployable**: Ready for VPS, Cloud, or Docker environments

**Key Features:**
- Add customer information (name, email, phone, address)
- Update customer details
- Search customers by name, email, or phone
- Delete customers with confirmation
- Customer status tracking
- Full API documentation
- Comprehensive logging system

---

## 👨‍💼 Team Members & Roles

| Name | Role | Responsibilities |
|------|------|------------------|
| **Ông Thân Quốc Trường** | Backend Engineer + DevOps + Infrastructure | API development, Database, CI/CD, Deployment |
| **Lê Duy Phước** | Frontend Engineer + QA/SRE | UI/UX, Testing, Incident Management, Debugging |

---

## 🔧 Requirements

### System Requirements
- Node.js 18+
- Docker & Docker Compose
- Git
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Technology Stack

**Backend:**
- Node.js 18
- Express.js 4
- MongoDB 6
- Mongoose 7
- CORS, Dotenv

**Frontend:**
- React 18
- Axios (HTTP client)
- CSS3 (responsive design)

**DevOps:**
- Docker (containerization)
- Docker Compose (orchestration)
- GitHub Actions (CI/CD)
- MongoDB (persistent storage)

---

## 🏗️ Project Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                     │
│           http://localhost:3001                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Customer Form | Customer List | Search Bar      │  │
│  │  Responsive UI | Real-time Updates               │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↕
                    AXIOS HTTP CLIENT
                          ↕
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (Express)                     │
│           http://localhost:5000                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  /api/health       - Health Check                │  │
│  │  /api/customers    - CRUD Operations             │  │
│  │  /api/customers/:id - Individual Customer        │  │
│  │  /api/customers/search/:keyword - Search         │  │
│  └──────────────────────────────────────────────────┘  │
│  Logging | Error Handling | Validation | CORS          │
└─────────────────────────────────────────────────────────┘
                          ↕
                  MONGOOSE ODM
                          ↕
┌─────────────────────────────────────────────────────────┐
│                  DATABASE (MongoDB)                     │
│           mongodb://mongo:27017                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Database: crm-db                                │  │
│  │  Collection: customers                           │  │
│  │  Schema: {name, email, phone, address, status}   │  │
│  │  Persistent Volume: mongo_data                   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Option 1: Using Docker Compose (Recommended)

```bash
# Clone/navigate to project
cd d:\CHUYENDECONGNGHEMOI\Simple_CRM_Pizza4P's

# Build and run all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3001
# Backend API: http://localhost:5000
# Health Check: http://localhost:5000/api/health
```

### Option 2: Local Development

#### Backend Setup
```bash
cd backend
npm install
npm run dev    # Starts with nodemon (auto-reload)
# API runs on http://localhost:5000
```

#### Frontend Setup (in another terminal)
```bash
cd frontend
npm install
npm start
# UI runs on http://localhost:3001
```

**Note:** Requires MongoDB running separately or update `DB_URL` in `.env`

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000
```

### Endpoints

#### Health Check (REQUIRED)
```http
GET /api/health

Response:
{
  "status": "ok",
  "message": "Simple CRM API is healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 123.45
}
```

#### Get All Customers
```http
GET /api/customers

Response:
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Nguyễn Văn A",
      "email": "nguyena@example.com",
      "phone": "0123456789",
      "address": "Đà Nẵng",
      "status": "active",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### Get Customer by ID
```http
GET /api/customers/:id

Example: GET /api/customers/507f1f77bcf86cd799439011
```

#### Create Customer
```http
POST /api/customers
Content-Type: application/json

Body:
{
  "name": "Nguyễn Văn A",
  "email": "nguyena@example.com",
  "phone": "0123456789",
  "address": "Đà Nẵng"
}

Response (201):
{
  "success": true,
  "data": {...},
  "message": "Customer created successfully"
}
```

#### Update Customer
```http
PUT /api/customers/:id
Content-Type: application/json

Body: {updated fields}
```

#### Delete Customer
```http
DELETE /api/customers/:id

Response:
{
  "success": true,
  "message": "Customer deleted successfully"
}
```

#### Search Customers
```http
GET /api/customers/search/:keyword

Example: GET /api/customers/search/nguyen
```

---

## 🐳 Docker & DevOps

### Docker Compose Services

```yaml
mongo      - MongoDB 6.0 (Port 27017)
backend    - Node.js Express API (Port 5000)
frontend   - React Web App (Port 3000)
```

### Docker Commands

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongo

# Run single service
docker-compose up mongo
```

### Health Checks

Each service has automatic health checks:
- **Backend**: GET `/api/health` (30s interval)
- **Frontend**: HTTP GET to root (30s interval)
- **MongoDB**: MongoDB ping command (10s interval)

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

**Location:** `.github/workflows/ci.yml`

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Pipeline Stages:**

1. **Backend CI**
   - Install dependencies
   - Lint checks (ESLint)
   - Run tests
   - Build verification

2. **Frontend CI**
   - Install dependencies
   - Lint checks (ESLint)
   - Run tests
   - Build optimized bundle

3. **Docker Build**
   - Build backend image
   - Build frontend image
   - Cache optimization

4. **Security Checks**
   - Detect hardcoded credentials
   - Verify environment variables
   - Check `.env.example` files

### Pipeline Status

Check GitHub Actions tab for real-time status.

---

## ☁️ Deployment

### Deploy to Vercel (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel --prod
```

### Deploy to Render (Backend)

1. Create account at [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repository
4. Configure:
   - Build command: `npm install`
   - Start command: `node src/server.js`
   - Environment: `DB_URL=your_mongodb_url`
5. Deploy

### Deploy to Docker VPS

```bash
# SSH into VPS
ssh user@your-vps.com

# Clone repository
git clone https://github.com/your-username/simple-crm.git
cd simple-crm

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f
```

---

## 🐛 Incident Management

### Incident Report Template

**Incident #1: [Title]**
```
Symptom (现象):     [What users see]
Layer (层):          [L4/L3/L2/L1]
Root Cause (原因):   [Why it happens]
Solution (解决):     [How to fix]
Prevention (预防):   [How to avoid]
```

See [INCIDENTS.md](./INCIDENTS.md) for detailed incident reports.

---

## 📝 Development Guide

### Project Structure

```
Simple_CRM_Pizza4P's/
├── backend/
│   ├── src/
│   │   ├── server.js        # Main Express server
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API routes
│   │   └── middleware/      # Custom middleware
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   ├── Dockerfile
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── App.js           # Main React component
│   │   ├── App.css          # Styles
│   │   ├── components/      # Reusable components
│   │   └── index.js         # Entry point
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   ├── .env
│   ├── Dockerfile
│   └── README.md
├── .github/
│   └── workflows/
│       └── ci.yml           # GitHub Actions
├── docker-compose.yml
├── .gitignore
└── README.md
```

### Environment Variables

**Backend (.env)**
```
PORT=5000
DB_URL=mongodb://admin:password@mongo:27017/crm-db
NODE_ENV=production
LOG_LEVEL=info
```

**Frontend (.env)**
```
REACT_APP_API_URL=http://localhost:5000
```

### Adding Features

1. Create feature branch
```bash
git checkout -b feature/new-feature
```

2. Make changes
```bash
# Frontend
cd frontend
npm start

# Backend (in another terminal)
cd backend
npm run dev
```

3. Test changes
4. Commit
```bash
git add .
git commit -m "feat: add new feature"
```

5. Push and create Pull Request
```bash
git push origin feature/new-feature
```

---

## 📊 Logging & Monitoring

### Backend Logs

Logs include:
- Request/Response logging
- Database operations
- Error tracking
- Performance metrics
- Health checks

View logs:
```bash
docker-compose logs backend
```

### Frontend Console

No console errors expected. Check browser DevTools if issues occur.

---

## ✅ Quality Checklist

- [x] Frontend loads without errors
- [x] No console errors
- [x] Backend `/api/health` responds
- [x] CRUD operations work
- [x] Docker images build successfully
- [x] `docker-compose up` runs all services
- [x] CI/CD pipeline passes
- [x] Environment variables configured
- [x] `.env.example` files present
- [x] Incident reports documented
- [x] All endpoints testable with Postman/curl

---

## 🔗 Links & Resources

- **GitHub**: [Repository Link]
- **Docker Hub**: [Image Link]
- **API Docs**: See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Incidents**: See [INCIDENTS.md](./INCIDENTS.md)
- **Deployment**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📜 License

MIT

---

**Last Updated**: April 2024  
**Team**: Ông Thân Quốc Trường, Lê Duy Phước  
**Institution**: Đại Học Kiến Trúc Đà Nẵng
