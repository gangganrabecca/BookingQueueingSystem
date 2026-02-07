import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Services.css';

const Services = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get('/api/services');
      setServices(response.data.services);
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  const serviceDetails = {
    'Birth Certificate': {
      id: 'birth-cert',
      requirements: [
        'National ID',
        'Negative result (PSA)',
        'Affidavit of delay registration',
        'Voter certification',
        'Permanent record'
      ]
    },
    'Marriage Certificate': {
      id: 'marriage-cert',
      requirements: [
        'Valid ID',
        'Marriage contract (if applicable)',
        'PSA Certificate of Marriage',
        'Affidavit (if needed)'
      ]
    },
    'Certificate of No Marriage': {
      id: 'no-marriage-cert',
      requirements: [
        'Valid ID',
        'PSA Certificate of No Marriage',
        'Barangay Clearance',
        'Birth Certificate'
      ]
    },
    'Death Registration': {
      id: 'death-reg',
      requirements: [
        'Valid ID of informant',
        'Death certificate from hospital/clinic',
        'PSA Certificate of Death',
        'Affidavit (if needed)'
      ]
    }
  };

  const handleServiceClick = (serviceName) => {
    const details = serviceDetails[serviceName];
    if (details) {
      setSelectedService({ name: serviceName, ...details });
    } else {
      // Use requirements from API if available
      const service = services.find(s => s.name === serviceName);
      if (service && service.requirements) {
        setSelectedService({ name: serviceName, requirements: service.requirements });
      }
    }
  };

  if (loading) {
    return <div className="services-container">Loading...</div>;
  }

  return (
    <div className="services-container">
      <div className="services-card">
        <button className="back-btn" onClick={() => navigate('/homepage')}>
          ← Back
        </button>
        <h1>Services</h1>

        {!selectedService ? (
          <div className="services-grid">
            {services.map((service) => (
              <button
                key={service.id}
                className="service-button"
                onClick={() => handleServiceClick(service.name)}
              >
                {service.name}
              </button>
            ))}
          </div>
        ) : (
          <div className="service-details">
            <button className="back-to-services" onClick={() => setSelectedService(null)}>
              ← Back to Services
            </button>
            <h2>{selectedService.name}</h2>
            <div className="requirements-section">
              <h3>Requirements:</h3>
              <ul className="requirements-list">
                {selectedService.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Services;
