const neo4j = require('neo4j-driver');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const adminConfig = require('./adminConfig');

// Check if Neo4j credentials are provided
const NEO4J_URI = process.env.NEO4J_URI || 'neo4j+s://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';

let driver;

if (NEO4J_URI && NEO4J_USER && NEO4J_PASSWORD) {
  try {
    driver = neo4j.driver(
      NEO4J_URI,
      neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
    );

    // Test connection and initialize admin
    const testConnection = async () => {
      try {
        await driver.verifyConnectivity();
        console.log('✓ Neo4j connection established successfully');
        
        // Auto-create admin account if it doesn't exist
        await initializeAdmin();
      } catch (error) {
        console.warn('⚠ Neo4j connection error:', error.message);
        console.warn('⚠ Please configure NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD in .env file');
      }
    };

    testConnection();
  } catch (error) {
    console.error('Failed to initialize Neo4j driver:', error.message);
  }
} else {
  console.warn('⚠ Neo4j credentials not configured. Please set NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD in .env file');
}

// Initialize admin account
const initializeAdmin = async () => {
  const session = driver.session();
  
  try {
    // Check if admin exists
    const result = await session.run(
      'MATCH (u:User {email: $email}) RETURN u',
      { email: adminConfig.ADMIN_EMAIL }
    );

    if (result.records.length === 0) {
      // Create admin account
      const hashedPassword = await bcrypt.hash(adminConfig.ADMIN_PASSWORD, 10);
      const uuid = crypto.randomUUID();
      
      await session.run(
        `CREATE (u:User {
          id: $uuid,
          name: $name,
          email: $email,
          password: $password,
          role: 'admin',
          createdAt: datetime()
        })
        RETURN u`,
        {
          uuid,
          name: adminConfig.ADMIN_NAME,
          email: adminConfig.ADMIN_EMAIL,
          password: hashedPassword
        }
      );
      
      console.log('✓ Admin account created automatically');
      console.log(`  Email: ${adminConfig.ADMIN_EMAIL}`);
      console.log(`  Password: ${adminConfig.ADMIN_PASSWORD}`);
    } else {
      // Update admin password to match config (in case it was changed)
      const user = result.records[0].get('u').properties;
      const hashedPassword = await bcrypt.hash(adminConfig.ADMIN_PASSWORD, 10);
      
      await session.run(
        `MATCH (u:User {email: $email})
         SET u.role = 'admin', u.password = $password
         RETURN u`,
        { email: adminConfig.ADMIN_EMAIL, password: hashedPassword }
      );
      
      console.log('✓ Admin account verified');
    }
  } catch (error) {
    console.error('Error initializing admin:', error.message);
  } finally {
    await session.close();
  }
};

module.exports = driver;
