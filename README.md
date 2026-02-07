# Booking and Queuing System for Municipal Registrar of Bongao

A mobile-responsive web application for booking appointments and managing queues at the Municipal Registrar office.

## Features

- **User Authentication**: Login and Signup
- **Booking System**: Book appointments with service, date, and time selection
- **Appointment Management**: View, edit, and cancel appointments
- **Queue System**: Automatic queue number assignment
- **Services Information**: Requirements for different certificate types
- **Office Map**: Location and contact information
- **Admin Dashboard**: Manage services, dates, and times

## Tech Stack

- **Frontend**: React.js with React Router
- **Backend**: Node.js with Express
- **Database**: Neo4j Aura

## Installation

1. Install server dependencies:
```bash
npm install
```

2. Install client dependencies:
```bash
cd client && npm install
```

3. Create a `.env` file in the root directory:
```
NEO4J_URI=your_neo4j_uri
NEO4J_USER=your_neo4j_user
NEO4J_PASSWORD=your_neo4j_password
JWT_SECRET=your_jwt_secret
PORT=5000
```

4. Run the application:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`
