const express = require('express');
const crypto = require('crypto');
const driver = require('../config/neo4j');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();
const session = driver.session();

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

// Manage services
router.get('/services', async (req, res) => {
  try {
    const result = await session.run('MATCH (s:Service) RETURN s ORDER BY s.name');
    const services = result.records.map(record => record.get('s').properties);
    res.json({ services });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/services', async (req, res) => {
  const { id, name, requirements } = req.body;

  try {
    const serviceId = id || crypto.randomUUID();
    const result = await session.run(
      `CREATE (s:Service {
        id: $serviceId,
        name: $name,
        requirements: $requirements
      })
      RETURN s`,
      { serviceId, name, requirements }
    );

    const service = result.records[0].get('s').properties;
    res.status(201).json({ service });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/services/:id', async (req, res) => {
  const { id } = req.params;
  const { name, requirements } = req.body;

  try {
    const result = await session.run(
      `MATCH (s:Service {id: $id})
       SET s.name = $name, s.requirements = $requirements
       RETURN s`,
      { id, name, requirements }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const service = result.records[0].get('s').properties;
    res.json({ service });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/services/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await session.run('MATCH (s:Service {id: $id}) DELETE s', { id });
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Manage available dates and times
router.get('/availability', async (req, res) => {
  try {
    const result = await session.run('MATCH (a:Availability) RETURN a ORDER BY a.date, a.time');
    const availabilities = result.records.map(record => record.get('a').properties);
    res.json({ availabilities });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/availability', async (req, res) => {
  const { date, time, slots } = req.body;

  try {
    const uuid = crypto.randomUUID();
    const result = await session.run(
      `MERGE (a:Availability {date: $date, time: $time})
       ON CREATE SET a.slots = $slots, a.id = $uuid
       ON MATCH SET a.slots = $slots
       RETURN a`,
      { uuid, date, time, slots: slots || 10 }
    );

    const availability = result.records[0].get('a').properties;
    res.status(201).json({ availability });
  } catch (error) {
    console.error('Create availability error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/availability/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await session.run('MATCH (a:Availability {id: $id}) DELETE a', { id });
    res.json({ message: 'Availability deleted successfully' });
  } catch (error) {
    console.error('Delete availability error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
