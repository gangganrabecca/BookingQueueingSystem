# Post-Deployment Setup Guide

## 1. Verify Backend Deployment

### Check Backend Health
Open your backend URL in browser:
```
https://your-backend-name.onrender.com/health
```
You should see: `{"status": "ok"}`

### Check API Documentation
Visit:
```
https://your-backend-name.onrender.com/docs
```
Verify all endpoints are visible.

## 2. Configure Frontend Environment

### Set Production API URL
In your Render dashboard:
1. Go to your frontend service
2. Settings > Environment
3. Add/Update:
   - Key: `REACT_APP_API_URL`
   - Value: `https://your-backend-name.onrender.com`
4. Save and trigger redeploy

## 3. Configure CORS on Backend

### Update CORS Origins
In `server/main.py`, find the CORS middleware and update:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend-name.onrender.com",
        "http://localhost:3000",  # for local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Add Health Endpoint (if missing)
```python
@app.get("/health")
async def health():
    return {"status": "ok"}
```

## 4. Test All Features

### Create Admin Account
1. Open your deployed frontend
2. Go to Sign Up
3. Create first account (this becomes admin)
4. Note the credentials

### Test User Registration
1. Use a different email
2. Sign up as regular user
3. Verify login works

### Test Booking Flow
1. Login as user
2. Book an appointment
3. Check queue number is assigned
4. Verify admin can see the booking

### Test Admin Dashboard
1. Login as admin
2. Check all appointments appear
3. Verify queue numbers are correct

## 5. Environment Variables Checklist

### Backend Environment Variables
In Render backend service settings:
- ✅ `PORT`: `10000` (or Render's assigned port)
- ✅ `NEO4J_URI`: your Aura URI
- ✅ `NEO4J_USER` or `NEO4J_USERNAME`: Aura username
- ✅ `NEO4J_PASSWORD`: Aura password
- ✅ `JWT_SECRET`: random secret string

### Frontend Environment Variables
- ✅ `REACT_APP_API_URL`: backend URL

## 6. Database Setup

### Verify Neo4j Aura
1. Login to Neo4j Aura Console
2. Check your database is active
3. Note connection details match backend env vars
4. Monitor usage/limits

### Create Initial Data (if needed)
Your app auto-creates:
- Default services on first API call
- Admin user on first signup

## 7. Troubleshooting Common Issues

### Can't Login
- Check frontend API URL is correct
- Verify backend is running
- Check browser console for errors
- Verify CORS settings

### Bookings Not Working
- Check backend logs for errors
- Verify database connection
- Check JWT_SECRET is set

### Admin Dashboard Issues
- Verify first user has admin role
- Check appointment fetching in browser network tab
- Confirm database has appointments

### CORS Errors
```python
# Temporary fix for testing (remove in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Only for testing!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 8. Security Checklist

### Before Going Live
- ✅ Remove temporary CORS allowances
- ✅ Use HTTPS everywhere (Render provides this)
- ✅ Set strong JWT_SECRET
- ✅ Monitor Neo4j Aura usage
- ✅ Regular backups (Aura handles this)

## 9. Performance Optimization

### Backend
- Enable database connection pooling
- Add response caching where appropriate
- Monitor Render metrics

### Frontend
- Optimize bundle size
- Enable service worker for caching
- Use CDN for assets (Render provides)

## 10. Monitoring and Maintenance

### Logs to Check Regularly
- Backend logs: Render Dashboard > Backend > Logs
- Frontend build logs: Render Dashboard > Frontend > Logs
- Database: Neo4j Aura Console

### Automated Health Checks
Add uptime monitoring:
- UptimeRobot or similar
- Monitor `/health` endpoint
- Alert on downtime

## 11. Custom Domain (Optional)

### Setup Custom Domain
1. Go to service settings > Custom Domains
2. Add your domain (e.g., app.yourdomain.com)
3. Update DNS as instructed
4. Update CORS origins
5. Update frontend REACT_APP_API_URL if needed

## 12. Final Testing Checklist

### User Journey
- [ ] New user can sign up
- [ ] User can login
- [ ] User can book appointment
- [ ] Queue number assigned immediately
- [ ] User can view queue
- [ ] User can manage appointments
- [ ] Admin can see all bookings
- [ ] Admin can manage services
- [ ] Admin can manage availability

### Technical
- [ ] No console errors
- [ ] All API calls succeed
- [ ] Database operations work
- [ ] CORS properly configured
- [ ] Environment variables set
- [ ] Health endpoints responding

## 13. Going Live

### Launch Steps
1. Test everything thoroughly
2. Backup database (Aura handles)
3. Share the frontend URL
4. Monitor initial usage
5. Have rollback plan ready

### Post-Launch
- Monitor error rates
- Check user feedback
- Scale resources if needed
- Regular security updates

## 14. Emergency Procedures

### If Backend Goes Down
1. Check Render logs
2. Verify environment variables
3. Check Neo4j Aura status
4. Restart service if needed

### If Database Issues
1. Check Aura console
2. Verify credentials
3. Check connection limits
4. Contact support if needed

## Quick URL Reference
- Frontend: `https://your-frontend-name.onrender.com`
- Backend API: `https://your-backend-name.onrender.com`
- API Docs: `https://your-backend-name.onrender.com/docs`
- Health Check: `https://your-backend-name.onrender.com/health`
- Neo4j Aura: `console.neo4j.io`

Save this checklist and verify each item. Your app should be fully functional after completing these steps!
