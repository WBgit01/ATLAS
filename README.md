# ATL Student Attendance Analytics (MERN)

This project provides a centralized Attendance Management + Analytics dashboard.
It imports biometric attendance exports from Excel, matches students by **normalized full name** (case-insensitive), stores attendance in **MongoDB**, and recalculates analytics and service-hours automatically.

## Tech stack

- Frontend: React + Vite, Material UI, Recharts
- Backend: Node.js + Express (JWT auth, RBAC)
- Data: MongoDB (Mongoose)
- Excel processing: Python (Pandas + OpenPyXL)

## Prerequisites

1. Node.js (v22+ works well)
2. Python 3.x
3. MongoDB (ensure `mongod` is available)

## Setup

### 1) Python service dependencies

```powershell
pip install -r "c:\Users\Will\Desktop\ATL\python-service\requirements.txt"
```

### 2) Node dependencies

From the repo root:

```powershell
npm install
npm run install:all
```

### 3) Backend environment

Copy `.env.example` to `.env` if needed.
Default values are already present in `backend\.env` in this workspace.

### 4) Start MongoDB

This project expects a local MongoDB by default.
Start MongoDB however your system typically does it, or run:

```powershell
mongod --dbpath "c:\Users\Will\Desktop\ATL\data" --port 27017
```

If you use a different DB/host, update `backend\.env` → `MONGODB_URI`.

### 5) Seed admin user + policy settings

```powershell
npm run seed
```

Default admin credentials:

- Email: `admin@atl.edu`
- Password: `Admin@123`

## Run the application (dev)

```powershell
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Importing attendance (Excel)

1. Go to **Import Attendance**
2. Upload the Excel file exported by your biometric device
3. The backend will:
   - Extract & clean time-in/time-out punches (Python)
   - Normalize student names
   - Match students by **normalized full name**
   - Compute daily hours + attendance flags
   - Recalculate attendance analytics & remaining service hours

You can review anomalies from the **Anomalies** page.

## Notes on name matching

- Matching is performed by `normalizedName`, which is:
  - trimmed
  - lowercased
  - whitespace collapsed (duplicate spaces removed)
- The biometric device user ID is stored, but it is **not** used as the primary matching key.

