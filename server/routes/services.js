const express = require('express');
const driver = require('../config/neo4j');

const router = express.Router();
const session = driver.session();

// Get all services
router.get('/', async (req, res) => {
  try {
    const result = await session.run(
      'MATCH (s:Service) RETURN s ORDER BY s.name'
    );

    const services = result.records.map(record => record.get('s').properties);

    // Default services if none exist
    if (services.length === 0) {
      const defaultServices = [
        {
          id: 'birth-cert',
          name: 'Birth Certificate',
          requirements: [
            'National ID',
            'Negative result (PSA)',
            'Affidavit of delay registration',
            'Voter certification',
            'Permanent record'
          ]
        },
        {
          id: 'marriage-cert',
          name: 'Marriage Certificate',
          requirements: [
            'Valid ID',
            'Marriage contract (if applicable)',
            'PSA Certificate of Marriage',
            'Affidavit (if needed)'
          ]
        },
        {
          id: 'no-marriage-cert',
          name: 'Certificate of No Marriage',
          requirements: [
            'Valid ID',
            'PSA Certificate of No Marriage',
            'Barangay Clearance',
            'Birth Certificate'
          ]
        },
        {
          id: 'death-reg',
          name: 'Death Registration',
          requirements: [
            'Valid ID of informant',
            'Death certificate from hospital/clinic',
            'PSA Certificate of Death',
            'Affidavit (if needed)'
          ]
        }
      ];

      // Create default services
      for (const service of defaultServices) {
        await session.run(
          `CREATE (s:Service {
            id: $id,
            name: $name,
            requirements: $requirements
          })`,
          service
        );
      }

      return res.json({ services: defaultServices });
    }

    res.json({ services });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get service by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await session.run(
      'MATCH (s:Service {id: $id}) RETURN s',
      { id }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const service = result.records[0].get('s').properties;

    res.json({ service });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
