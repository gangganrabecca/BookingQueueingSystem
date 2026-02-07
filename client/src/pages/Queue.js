import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Queue.css';

const Queue = () => {
  const navigate = useNavigate();
  const [queueNumber, setQueueNumber] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      const response = await axios.get('/api/queue/current');
      setQueueNumber(response.data.queueNumber ?? null);
      setAppointment(response.data.appointment ?? null);
    } catch (err) {
      console.error('Error fetching queue:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="queue-container">Loading...</div>;
  }

  return (
    <div className="queue-container">
      <div className="queue-card">
        <button className="back-btn" onClick={() => navigate('/homepage')}>
          ← Back
        </button>
        <h1>Queue</h1>

        {queueNumber ? (
          <div className="queue-display">
            <div className="queue-number-circle">
              <div className="queue-label">Your Queue Number</div>
              <div className="queue-number">{queueNumber}</div>
            </div>
            
            {appointment && (
              <div className="queue-info">
                <h2>Appointment Details</h2>
                <div className="info-row">
                  <span className="info-label">Service:</span>
                  <span className="info-value">{appointment.service}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Date:</span>
                  <span className="info-value">
                    {new Date(appointment.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Time:</span>
                  <span className="info-value">{appointment.time || 'Any time'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Estimated Date:</span>
                  <span className="info-value">
                    {new Date(appointment.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            )}

            <div className="queue-note">
              <p>Please arrive on time for your appointment.</p>
              <p>Your queue number is: <strong>{queueNumber}</strong></p>
            </div>
          </div>
        ) : (
          <div className="no-queue">
            <p>You don't have any active appointments.</p>
            <button className="book-btn" onClick={() => navigate('/booking')}>
              Book Appointment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Queue;
