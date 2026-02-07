const express = require('express');
const crypto = require('crypto');
const driver = require('../config/neo4j');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const session = driver.session();

// Create appointment
router.post('/', authMiddleware, async (req, res) => {
  const { name, email, service, date, time } = req.body;
  const userId = req.user.userId;

  try {
    // Get current queue number
    const queueResult = await session.run(
      'MATCH (a:Appointment) RETURN count(a) as count'
    );
    const queueNumber = (queueResult.records[0].get('count').toNumber() || 0) + 1;

    // Generate UUID
    const uuid = crypto.randomUUID();

    // Create appointment
    const result = await session.run(
      `MATCH (u:User {id: $userId})
       CREATE (a:Appointment {
         id: $uuid,
         name: $name,
         email: $email,
         service: $service,
         date: $date,
         time: $time,
         queueNumber: $queueNumber,
         status: 'pending',
         createdAt: datetime()
       })
       CREATE (u)-[:HAS_APPOINTMENT]->(a)
       RETURN a`,
      { uuid, userId, name, email, service, date, time, queueNumber }
    );

    const appointment = result.records[0].get('a').properties;

    res.status(201).json({ appointment });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user appointments
router.get('/my-appointments', authMiddleware, async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId})-[:HAS_APPOINTMENT]->(a:Appointment)
       RETURN a ORDER BY a.createdAt DESC`,
      { userId }
    );

    const appointments = result.records.map(record => record.get('a').properties);

    res.json({ appointments });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get appointment by ID
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId})-[:HAS_APPOINTMENT]->(a:Appointment {id: $id})
       RETURN a`,
      { userId, id }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const appointment = result.records[0].get('a').properties;

    res.json({ appointment });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update appointment
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, email, service, date, time } = req.body;
  const userId = req.user.userId;

  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId})-[:HAS_APPOINTMENT]->(a:Appointment {id: $id})
       SET a.name = $name, a.email = $email, a.service = $service, 
           a.date = $date, a.time = $time, a.updatedAt = datetime()
       RETURN a`,
      { userId, id, name, email, service, date, time }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const appointment = result.records[0].get('a').properties;

    res.json({ appointment });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel appointment
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId})-[:HAS_APPOINTMENT]->(a:Appointment {id: $id})
       DELETE a
       RETURN a`,
      { userId, id }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
