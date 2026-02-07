# Admin Account Configuration

## Fixed Admin Credentials (Hardcoded in Code)

The admin credentials are **hardcoded** in the codebase:

**Location:** `server/config/adminConfig.js`

```javascript
ADMIN_EMAIL: 'admin@registrar.gov'
ADMIN_PASSWORD: 'admin123'
ADMIN_NAME: 'Administrator'
```

## Automatic Admin Creation

✅ **The admin account is automatically created when the server starts!**

No need to manually create it - the system checks for the admin account on startup and creates it if it doesn't exist.

## To Change Admin Credentials

Edit `server/config/adminConfig.js` and update the values:
```javascript
module.exports = {
  ADMIN_EMAIL: 'your-email@example.com',
  ADMIN_PASSWORD: 'your-password',
  ADMIN_NAME: 'Your Name'
};
```

Then restart the server. The admin account will be updated automatically.

## Manual Creation (Optional)

If you need to manually create/update the admin account, run:

```powershell
npm run create-admin
```

This uses the same credentials from `adminConfig.js`.

---

## Method 2: Update Existing User via Neo4j Browser

1. Sign up a normal account through the web app
2. Go to https://console.neo4j.io/
3. Open your database
4. Run this query in Neo4j Browser:

```cypher
MATCH (u:User {email: 'your-email@example.com'})
SET u.role = 'admin'
RETURN u
```

Replace `'your-email@example.com'` with your actual email.

---

## Method 3: Create Admin via API (Advanced)

If you want to create an admin via API call:

```powershell
# Using curl or Postman
POST http://localhost:5000/api/auth/signup
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@registrar.gov",
  "password": "yourpassword",
  "role": "admin"
}
```

⚠️ **Note:** The frontend signup form doesn't allow setting role (for security), but the API accepts it.

---

## After Creating Admin Account

1. Log in with your admin credentials
2. You should see an "Admin" button in the homepage header
3. Click it to access the Admin Dashboard
4. You can now:
   - Manage services (add, edit, delete)
   - Manage available dates and times
   - View all appointments

## Verify Admin Status

After logging in, check the homepage. If you see an "Admin" button in the top right, you have admin access!
