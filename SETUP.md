# Setup Guide - Booking and Queuing System

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Neo4j Aura account (free tier available)

## Installation Steps

### 1. Install Dependencies

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory with the following:

```
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password_here
JWT_SECRET=your_random_secret_key_here
PORT=5000
```

### 3. Get Neo4j Aura Credentials

1. Go to https://neo4j.com/cloud/aura/
2. Create a free account
3. Create a new database instance
4. Copy the connection URI, username, and password
5. Update your `.env` file with these credentials

### 4. Run the Application

```bash
# Run both server and client simultaneously
npm run dev

# Or run them separately:
# Terminal 1 - Server
npm run server

# Terminal 2 - Client
npm run client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### 5. Create Admin Account

1. Sign up with a new account
2. In Neo4j Browser, run this query to set user as admin:
```cypher
MATCH (u:User {email: 'your-email@example.com'})
SET u.role = 'admin'
RETURN u
```

Or you can create an admin account directly via the signup API with role 'admin'.

## Features

### Client Features
- ✅ User authentication (Login/Signup)
- ✅ Book appointments with service, date, and time selection
- ✅ View and manage appointments (edit/cancel)
- ✅ View queue number after booking
- ✅ Browse services and requirements
- ✅ View office location and contact details

### Admin Features
- ✅ Manage services (add, edit, delete)
- ✅ Manage available dates and times
- ✅ View all appointments

## Default Services

The system comes with 4 default services:
1. Birth Certificate
2. Marriage Certificate
3. Certificate of No Marriage
4. Death Registration

Each service has predefined requirements that can be managed by admin.

## Database Schema

### Nodes:
- `User` - User accounts (id, name, email, password, role)
- `Appointment` - Appointments (id, name, email, service, date, time, queueNumber, status)
- `Service` - Services (id, name, requirements)
- `Availability` - Available dates/times (id, date, time, slots)

### Relationships:
- `User` -[:HAS_APPOINTMENT]-> `Appointment`

## Troubleshooting

### Neo4j Connection Issues
- Verify your credentials in `.env`
- Check if your IP is whitelisted in Neo4j Aura
- Ensure the connection URI format is correct

### Port Already in Use
- Change the PORT in `.env` file
- Kill the process using the port: `npx kill-port 5000`

### Module Not Found Errors
- Run `npm install` in both root and client directories
- Delete `node_modules` and reinstall if issues persist

## Support

For issues or questions, check the README.md file or contact the development team.
