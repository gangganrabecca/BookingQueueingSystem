import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './BookingAppointment.css';

const BookingAppointment = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    service: '',
    date: ''
  });
  const [services, setServices] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchServices();
    fetchAvailability();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get('/api/services');
      setServices(response.data.services);
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  const fetchAvailability = async () => {
    // Generate default dates for next 30 days
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    // Only try to fetch admin availability if user is admin

    try {
      const response = await axios.get('/api/availability');
      const availabilities = response.data.availabilities || [];

      const availableDatesList = dates.filter((d) => {
        return availabilities.some((avail) => avail.date === d && (avail.slots ?? 0) > 0);
      });

      if (availableDatesList.length > 0) {
        setAvailableDates(availableDatesList);
        return;
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
    }

    // Default availability (for non-admin users or if admin fetch fails)
    setAvailableDates(dates);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleConfirm = async () => {
    if (!formData.name || !formData.email || !formData.service || !formData.date) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post('/api/appointments', formData);
      navigate('/queue');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-container">
      <div className="booking-card">
        <div className="booking-header">
          <button className="back-btn" onClick={() => navigate('/homepage')}>
            ← Back
          </button>
          <h1>Booking Appointment</h1>
        </div>

        <div className="booking-form">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Services</label>
            <select
              name="service"
              value={formData.service}
              onChange={handleChange}
              required
            >
              <option value="">Select services</option>
              {services.map((service) => (
                <option key={service.id} value={service.name}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Date</label>
            <select
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            >
              <option value="">Select date</option>
              {availableDates.map((date) => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </option>
              ))}
            </select>
          </div>


          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button
              className="confirm-btn"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? 'Confirming...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingAppointment;
