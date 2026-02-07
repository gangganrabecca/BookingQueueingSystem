# Render Deployment Guide

## Overview
- Backend: FastAPI (Python) on Render
- Frontend: React (Static Site) on Render
- Database: Neo4j Aura (already configured)

## Prerequisites
- Render account (free tier works)
- GitHub repository with your code
- Neo4j Aura credentials (already in .env)

## 1. Prepare Your Repository

### Add render.yaml for Backend
Create `render.yaml` in the root directory:

```yaml
services:
  # Backend Service
  - type: web
    name: registrar-backend
    env: python
    plan: free
    repo: https://github.com/YOUR_USERNAME/REPO_NAME.git
    rootDir: server
    buildCommand: "pip install -r requirements.txt"
    startCommand: "uvicorn main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: PORT
        value: 10000
      - fromGroup: neo4j-aura

  # Frontend Service
  - type: web
    name: registrar-frontend
    env: static
    plan: free
    repo: https://github.com/YOUR_USERNAME/REPO_NAME.git
    rootDir: client
    buildCommand: "npm run build"
    publishDir: build
    envVars:
      - key: REACT_APP_API_URL
        sync: false
```

### Update Frontend API URL
In `client/src/App.js` or setup axios defaults:

```javascript
// Add to App.js or api config
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

### Create render-build.sh for Frontend
Create `client/render-build.sh`:

```bash
#!/bin/bash
npm install
npm run build
```

Make it executable:
```bash
chmod +x client/render-build.sh
```

## 2. Environment Groups on Render

1. Go to Render Dashboard > Environment Groups
2. Create group named `neo4j-aura`
3. Add these environment variables:
   - `NEO4J_URI`: your Neo4j Aura URI
   - `NEO4J_USER` or `NEO4J_USERNAME`: your Neo4j username
   - `NEO4J_PASSWORD`: your Neo4j password
   - `JWT_SECRET`: generate a random secret (use: openssl rand -base64 32)

## 3. Deploy Steps

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Configure for Render deployment"
git push origin main
```

### Step 2: Create Backend Service
1. Go to Render Dashboard > New > Web Service
2. Connect your GitHub repository
3. Set:
   - Name: `registrar-backend`
   - Environment: `Python 3`
   - Root Directory: `server`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   - `PORT`: `10000`
   - Link the `neo4j-aura` environment group
5. Click Create Web Service

### Step 3: Create Frontend Service
1. Go to Render Dashboard > New > Static Site
2. Connect your GitHub repository
3. Set:
   - Name: `registrar-frontend`
   - Environment: `Node`
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Publish Directory: `build`
4. Add Environment Variables:
   - `REACT_APP_API_URL`: `https://registrar-backend.onrender.com`
5. Click Create Static Site

## 4. Post-Deployment Configuration

### Update CORS on Backend
In `server/main.py`, update CORS origins:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://registrar-frontend.onrender.com",
        "http://localhost:3000"  # for local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Health Check Endpoint
Ensure you have a health endpoint:

```python
@app.get("/health")
async def health():
    return {"status": "ok"}
```

## 5. Access Your App

After deployment:
- Frontend: `https://registrar-frontend.onrender.com`
- Backend API: `https://registrar-backend.onrender.com`
- API Docs: `https://registrar-backend.onrender.com/docs`

## 6. Troubleshooting

### Common Issues
1. **CORS errors**: Make sure frontend URL is in CORS allow_origins
2. **Database connection**: Check environment variables in Render dashboard
3. **Build failures**: Check Render logs for specific error messages
4. **API calls failing**: Verify REACT_APP_API_URL is correct

### Logs
- Backend logs: Render Dashboard > registrar-backend > Logs
- Frontend logs: Render Dashboard > registrar-frontend > Logs

### Redeploy
Push changes to GitHub to trigger automatic redeploy:
```bash
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

## 7. Custom Domain (Optional)

1. Go to service settings > Custom Domains
2. Add your domain name
3. Configure DNS as instructed by Render
4. Update CORS origins to include your custom domain

## 8. Database Backup

Neo4j Aura handles backups automatically. Monitor your usage in the Aura dashboard.

## 9. Monitoring

- Render provides basic metrics in the dashboard
- Consider adding logging for production debugging
- Monitor Neo4j Aura usage and limits
