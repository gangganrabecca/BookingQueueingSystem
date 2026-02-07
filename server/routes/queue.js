const express = require('express');
const driver = require('../config/neo4j');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const session = driver.session();

// Get current queue number for user
router.get('/current', authMiddleware, async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId})-[:HAS_APPOINTMENT]->(a:Appointment)
       WHERE a.status = 'pending'
       RETURN a ORDER BY a.createdAt DESC LIMIT 1`,
      { userId }
    );

    if (result.records.length === 0) {
      return res.json({ queueNumber: null, message: 'No active appointments' });
    }

    const appointment = result.records[0].get('a').properties;

    res.json({ queueNumber: appointment.queueNumber, appointment });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all queue (admin)
router.get('/all', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const result = await session.run(
      `MATCH (a:Appointment)
       WHERE a.status = 'pending'
       RETURN a ORDER BY a.queueNumber ASC`
    );

    const appointments = result.records.map(record => record.get('a').properties);

    res.json({ appointments });
  } catch (error) {
    console.error('Get all queue error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
