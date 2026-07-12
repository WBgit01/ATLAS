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