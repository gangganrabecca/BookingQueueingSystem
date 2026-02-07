# Quick Start Guide

## The Problem
Your frontend is running but the backend server is not, which causes the "ECONNREFUSED" errors.

## Solution - Start the Backend Server

You need to open **TWO terminal windows**:

### Terminal 1 - Backend Server
```powershell
# Make sure you're in the root directory (not in client/)
cd "C:\Users\User\Desktop\2nd system"

# Start the server
npm run server
```

### Terminal 2 - Frontend (Already Running)
```powershell
# Keep the client running in this terminal
cd "C:\Users\User\Desktop\2nd system\client"
npm run dev
```

## OR - Run Both Together (Easier)

In the root directory:
```powershell
cd "C:\Users\User\Desktop\2nd system"
npm run dev
```

This will start both server and client automatically.

## Configure Neo4j (Required)

Before the app will work fully, you need to:

1. **Create a Neo4j Aura account**: https://neo4j.com/cloud/aura/ (free tier available)
2. **Create a database instance** and get your credentials
3. **Update the `.env` file** in the root directory with your Neo4j credentials:
   ```
   NEO4J_URI=neo4j+s://your-actual-instance.databases.neo4j.io
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your_actual_password
   ```

## Quick Test

Once both are running, test the backend:
- Visit: http://localhost:5000/api/health
- Should show: `{"status":"OK","message":"Server is running"}`

The frontend should then be able to connect at: http://localhost:3000
