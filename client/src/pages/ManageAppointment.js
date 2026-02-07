import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ManageAppointment.css';

const ManageAppointment = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    service: '',
    date: ''
  });
  const [services, setServices] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAppointments();
    fetchServices();
    fetchAvailability();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get('/api/appointments/my-appointments');
      setAppointments(response.data.appointments);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleEdit = (appointment) => {
    setEditingId(appointment.id);
    setEditForm({
      name: appointment.name,
      email: appointment.email,
      service: appointment.service,
      date: appointment.date
    });
    setError('');
  };

  const handleSaveChanges = async () => {
    if (!editForm.name || !editForm.email || !editForm.service || !editForm.date) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await axios.put(`/api/appointments/${editingId}`, editForm);
      setEditingId(null);
      fetchAppointments();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update appointment. Please try again.');
    }
  };

  const handleCancel = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await axios.delete(`/api/appointments/${appointmentId}`);
        fetchAppointments();
      } catch (err) {
        alert('Failed to cancel appointment. Please try again.');
      }
    }
  };

  if (loading) {
    return <div className="manage-container">Loading...</div>;
  }

  if (appointments.length === 0) {
    return (
      <div className="manage-container">
        <div className="manage-card">
          <button className="back-btn" onClick={() => navigate('/homepage')}>
            ← Back
          </button>
          <h1>Manage Appointment</h1>
          <div className="no-appointments">
            <p>You have no appointments yet.</p>
            <button className="book-btn" onClick={() => navigate('/booking')}>
              Book Appointment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-container">
      <div className="manage-card">
        <button className="back-btn" onClick={() => navigate('/homepage')}>
          ← Back
        </button>
        <h1>Manage Appointment</h1>

        {appointments.map((appointment) => (
          <div key={appointment.id} className="appointment-item">
            {editingId === appointment.id ? (
              <div className="edit-form">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Services</label>
                  <select
                    value={editForm.service}
                    onChange={(e) => setEditForm({ ...editForm, service: e.target.value })}
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
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
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
                <button className="save-btn" onClick={handleSaveChanges}>
                  Save Changes
                </button>
                <button className="cancel-edit-btn" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <div className="appointment-details">
                  <h3>Appointment Details</h3>
                  <div className="detail-row">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{appointment.name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{appointment.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Service:</span>
                    <span className="detail-value">{appointment.service}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">
                      {new Date(appointment.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Time:</span>
                    <span className="detail-value">{appointment.time}</span>
                  </div>
                  {appointment.queueNumber && (
                    <div className="detail-row">
                      <span className="detail-label">Queue Number:</span>
                      <span className="detail-value">{appointment.queueNumber}</span>
                    </div>
                  )}
                  <div className="appointment-actions">
                    <button className="edit-btn" onClick={() => handleEdit(appointment)}>
                      Edit Appointment
                    </button>
                    <button className="cancel-btn" onClick={() => handleCancel(appointment.id)}>
                      Cancel Appointment
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageAppointment;
