const bcrypt = require('bcryptjs');
const driver = require('../config/neo4j');
const adminConfig = require('../config/adminConfig');
require('dotenv').config();

const createAdmin = async () => {
  const session = driver.session();
  
  // Use fixed admin credentials from config
  const name = adminConfig.ADMIN_NAME;
  const email = adminConfig.ADMIN_EMAIL;
  const password = adminConfig.ADMIN_PASSWORD;
  
  try {
    // Check if user already exists
    const existingUser = await session.run(
      'MATCH (u:User {email: $email}) RETURN u',
      { email }
    );

    if (existingUser.records.length > 0) {
      // Update existing user to admin
      const hashedPassword = await bcrypt.hash(password, 10);
      await session.run(
        `MATCH (u:User {email: $email})
         SET u.role = 'admin', u.password = $password
         RETURN u`,
        { email, password: hashedPassword }
      );
      console.log(`✓ Existing user "${email}" updated to admin role`);
      console.log(`  Password has been updated`);
    } else {
      // Create new admin user
      const crypto = require('crypto');
      const uuid = crypto.randomUUID();
      const hashedPassword = await bcrypt.hash(password, 10);
      
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
        { uuid, name, email, password: hashedPassword }
      );
      
      console.log(`✓ Admin account created successfully!`);
      console.log(`  Email: ${email}`);
      console.log(`  Password: ${password}`);
      console.log(`  Role: admin`);
    }
    
  } catch (error) {
    console.error('Error creating admin:', error.message);
  } finally {
    await session.close();
    await driver.close();
    process.exit(0);
  }
};

createAdmin();
