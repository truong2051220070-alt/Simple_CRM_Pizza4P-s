# Submission Checklist - Simple CRM Pizza4P

Updated: 2026-04-23

## 1) Functional Requirements

- [x] Frontend running at http://localhost:3001
- [x] Backend API running at http://localhost:5000
- [x] MongoDB connected and healthy in Docker
- [x] Health endpoint works: GET /api/health
- [x] Customer create API works: POST /api/customers
- [x] Customer list API works: GET /api/customers
- [x] Sample data inserted (4 records available)

## 2) DevOps and Container Requirements

- [x] docker-compose with 3 services (frontend, backend, mongo)
- [x] Health checks configured for mongo/backend/frontend
- [x] Persistent volume configured for MongoDB
- [x] Network configured for service-to-service communication
- [x] Environment template files available:
  - backend/.env.example
  - frontend/.env.example
- [x] CI workflow file exists: .github/workflows/ci.yml
- [x] Incident document exists: INCIDENTS.md
- [x] API document exists: API_DOCUMENTATION.md
- [x] Deployment guide exists: DEPLOYMENT.md

## 3) Current Gaps (Need completion before final submission)

- [ ] Backend automated tests implemented (current script: "No tests yet")
- [ ] Frontend test runtime verified on local machine after npm install
- [ ] Lint scripts standardized in backend/frontend package.json
- [ ] CI pipeline verified green on GitHub Actions
- [ ] Git repository status clean and pushed to remote
- [ ] Final screenshots attached for report

## 4) Verified Evidence (Local)

1. docker-compose status: all 3 services are Up and healthy
2. GET /api/health returns status ok
3. POST /api/customers returns success true
4. GET /api/customers returns count 4

## 5) Step-by-step to finish remaining checklist

1. Install dependencies:

```powershell
cd "D:\CHUYENDECONGNGHEMOI\Simple_CRM_Pizza4P's\backend"
npm install
cd ..\frontend
npm install
```

2. Start full stack:

```powershell
cd "D:\CHUYENDECONGNGHEMOI\Simple_CRM_Pizza4P's"
docker-compose up --build -d
```

3. Re-check API quickly:

```powershell
Invoke-WebRequest -Uri http://localhost:5000/api/health -UseBasicParsing | Select-Object -ExpandProperty Content
Invoke-WebRequest -Uri http://localhost:5000/api/customers -UseBasicParsing | Select-Object -ExpandProperty Content
```

4. Run frontend test/build after install:

```powershell
cd "D:\CHUYENDECONGNGHEMOI\Simple_CRM_Pizza4P's\frontend"
npm test -- --watchAll=false --passWithNoTests
npm run build
```

5. Push to GitHub (if this folder is a git repo):

```powershell
cd "D:\CHUYENDECONGNGHEMOI\Simple_CRM_Pizza4P's"
git add .
git commit -m "docs: add submission checklist and verify mongo/docker status"
git push
```

## 6) Notes

- Use -UseBasicParsing in PowerShell Invoke-WebRequest to avoid security prompt.
- Recommended DB setup for this lab: MongoDB in Docker (stable, no localhost binding issues).
