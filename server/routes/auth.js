const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const driver = require('../config/neo4j');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  const { name, email, password, role = 'client' } = req.body;
  const session = driver.session();

  try {
    // Check if user exists
    const existingUser = await session.run(
      'MATCH (u:User {email: $email}) RETURN u',
      { email }
    );

    if (existingUser.records.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate UUID
    const uuid = crypto.randomUUID();
    
    // Create user
    const result = await session.run(
      `CREATE (u:User {
        id: $uuid,
        name: $name,
        email: $email,
        password: $password,
        role: $role,
        createdAt: datetime()
      })
      RETURN u`,
      { uuid, name, email, password: hashedPassword, role }
    );

    const user = result.records[0].get('u').properties;
    delete user.password;

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    await session.close();
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const session = driver.session();

  try {
    const result = await session.run(
      'MATCH (u:User {email: $email}) RETURN u',
      { email }
    );

    if (result.records.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = result.records[0].get('u').properties;
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    delete user.password;

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    await session.close();
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  const session = driver.session();
  
  try {
    const result = await session.run(
      'MATCH (u:User {id: $userId}) RETURN u',
      { userId: req.user.userId }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.records[0].get('u').properties;
    delete user.password;

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    await session.close();
  }
});

module.exports = router;
