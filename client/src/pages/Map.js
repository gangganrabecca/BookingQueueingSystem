import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Map.css';

const Map = () => {
  const navigate = useNavigate();

  return (
    <div className="map-container">
      <div className="map-card">
        <button className="back-btn" onClick={() => navigate('/homepage')}>
          ← Back
        </button>
        <h1>Map & Contact</h1>

        <div className="map-section">
          <h2>Office Location</h2>
          <div className="map-placeholder">
            <div className="map-image">
              <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
                <rect width="400" height="300" fill="#e4e6eb"/>
                <rect x="150" y="100" width="100" height="80" fill="#1877f2" opacity="0.7"/>
                <text x="200" y="145" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
                  Municipal Registrar
                </text>
                <text x="200" y="165" textAnchor="middle" fill="white" fontSize="14">
                  Office
                </text>
                <circle cx="200" cy="140" r="5" fill="white"/>
                <path d="M 200 145 L 200 300" stroke="#1877f2" strokeWidth="2" strokeDasharray="5,5"/>
                <text x="200" y="280" textAnchor="middle" fill="#606770" fontSize="14">
                  Municipal Building, Bongao, Tawi-Tawi
                </text>
              </svg>
            </div>
            <p className="map-note">Municipal Registrar Office Location</p>
          </div>
        </div>

        <div className="contact-section">
          <h2>Contact Details</h2>
          <div className="contact-info">
            <div className="contact-item">
              <div className="contact-icon">📞</div>
              <div className="contact-details">
                <div className="contact-label">Phone Number</div>
                <div className="contact-value">
                  <a href="tel:09364677936">09364677936</a>
                </div>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">📘</div>
              <div className="contact-details">
                <div className="contact-label">Facebook Page</div>
                <div className="contact-value">
                  <a href="https://facebook.com/MunicipalOfBongao" target="_blank" rel="noopener noreferrer">
                    MunicipalOfBongao
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="office-hours">
          <h2>Office Hours</h2>
          <div className="hours-info">
            <p><strong>Monday - Friday:</strong> 8:00 AM - 5:00 PM</p>
            <p><strong>Saturday:</strong> 8:00 AM - 12:00 PM</p>
            <p><strong>Sunday:</strong> Closed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Map;
