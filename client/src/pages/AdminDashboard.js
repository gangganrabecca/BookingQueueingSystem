import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [availabilities, setAvailabilities] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newService, setNewService] = useState({ id: '', name: '', requirements: [] });
  const [newAvailability, setNewAvailability] = useState({ date: '', time: '', slots: 10 });
  const [editingService, setEditingService] = useState(null);
  const [reqInput, setReqInput] = useState('');

  useEffect(() => {
    fetchServices();
    fetchAvailabilities();
    fetchAppointments();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get('/api/admin/services');
      setServices(response.data.services);
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailabilities = async () => {
    try {
      const response = await axios.get('/api/admin/availability');
      setAvailabilities(response.data.availabilities || []);
    } catch (err) {
      console.error('Error fetching availabilities:', err);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await axios.get('/api/admin/appointments');
      setAppointments(response.data.appointments || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  };

  const handleAddService = async () => {
    if (!newService.id || !newService.name) {
      alert('Please fill in service ID and name');
      return;
    }

    try {
      await axios.post('/api/admin/services', newService);
      setNewService({ id: '', name: '', requirements: [] });
      fetchServices();
    } catch (err) {
      alert('Failed to add service');
    }
  };

  const handleUpdateService = async () => {
    try {
      await axios.put(`/api/admin/services/${editingService.id}`, editingService);
      setEditingService(null);
      fetchServices();
    } catch (err) {
      alert('Failed to update service');
    }
  };

  const handleDeleteService = async (id) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await axios.delete(`/api/admin/services/${id}`);
        fetchServices();
      } catch (err) {
        alert('Failed to delete service');
      }
    }
  };

  const handleAddAvailability = async () => {
    if (!newAvailability.date || !newAvailability.time) {
      alert('Please fill in date and time');
      return;
    }

    try {
      await axios.post('/api/admin/availability', newAvailability);
      setNewAvailability({ date: '', time: '', slots: 10 });
      fetchAvailabilities();
    } catch (err) {
      alert('Failed to add availability');
    }
  };

  const handleDeleteAvailability = async (id) => {
    if (window.confirm('Are you sure you want to delete this availability?')) {
      try {
        await axios.delete(`/api/admin/availability/${id}`);
        fetchAvailabilities();
      } catch (err) {
        alert('Failed to delete availability');
      }
    }
  };

  const addRequirement = () => {
    if (reqInput.trim()) {
      if (editingService) {
        setEditingService({
          ...editingService,
          requirements: [...editingService.requirements, reqInput.trim()]
        });
      } else {
        setNewService({
          ...newService,
          requirements: [...newService.requirements, reqInput.trim()]
        });
      }
      setReqInput('');
    }
  };

  const removeRequirement = (index, isEditing) => {
    if (isEditing) {
      setEditingService({
        ...editingService,
        requirements: editingService.requirements.filter((_, i) => i !== index)
      });
    } else {
      setNewService({
        ...newService,
        requirements: newService.requirements.filter((_, i) => i !== index)
      });
    }
  };

  if (loading) {
    return <div className="admin-container">Loading...</div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-card">
        <div className="admin-header">
          <button className="back-btn" onClick={() => navigate('/homepage')}>
            ← Back
          </button>
          <h1>Admin Dashboard</h1>
        </div>

        <div className="admin-tabs">
          <button
            className={activeTab === 'services' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('services')}
          >
            Manage Services
          </button>
          <button
            className={activeTab === 'availability' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('availability')}
          >
            Manage Dates & Times
          </button>
          <button
            className={activeTab === 'appointments' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('appointments')}
          >
            Manage Appointments
          </button>
        </div>

        {activeTab === 'services' && (
          <div className="admin-content">
            <h2>Add New Service</h2>
            <div className="admin-form">
              <input
                type="text"
                placeholder="Service ID (e.g., birth-cert)"
                value={newService.id}
                onChange={(e) => setNewService({ ...newService, id: e.target.value })}
              />
              <input
                type="text"
                placeholder="Service Name"
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
              />
              <div className="requirements-input">
                <input
                  type="text"
                  placeholder="Add requirement"
                  value={reqInput}
                  onChange={(e) => setReqInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
                />
                <button onClick={addRequirement}>Add</button>
              </div>
              <div className="requirements-list">
                {newService.requirements.map((req, index) => (
                  <span key={index} className="requirement-tag">
                    {req}
                    <button onClick={() => removeRequirement(index, false)}>×</button>
                  </span>
                ))}
              </div>
              <button className="add-btn" onClick={handleAddService}>
                Add Service
              </button>
            </div>

            <h2>Existing Services</h2>
            <div className="services-list">
              {services.map((service) => (
                <div key={service.id} className="service-item">
                  {editingService?.id === service.id ? (
                    <div className="edit-service-form">
                      <input
                        type="text"
                        value={editingService.name}
                        onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                      />
                      <div className="requirements-list">
                        {editingService.requirements.map((req, index) => (
                          <span key={index} className="requirement-tag">
                            {req}
                            <button onClick={() => removeRequirement(index, true)}>×</button>
                          </span>
                        ))}
                      </div>
                      <div className="service-actions">
                        <button className="save-btn" onClick={handleUpdateService}>
                          Save
                        </button>
                        <button className="cancel-btn" onClick={() => setEditingService(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="service-info">
                        <h3>{service.name}</h3>
                        <div className="requirements-list">
                          {service.requirements?.map((req, index) => (
                            <span key={index} className="requirement-tag">{req}</span>
                          ))}
                        </div>
                      </div>
                      <div className="service-actions">
                        <button
                          className="edit-btn"
                          onClick={() => setEditingService({ ...service, requirements: service.requirements || [] })}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteService(service.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'availability' && (
          <div className="admin-content">
            <h2>Add Available Date & Time</h2>
            <div className="admin-form">
              <input
                type="date"
                value={newAvailability.date}
                onChange={(e) => setNewAvailability({ ...newAvailability, date: e.target.value })}
              />
              <input
                type="time"
                value={newAvailability.time}
                onChange={(e) => setNewAvailability({ ...newAvailability, time: e.target.value })}
              />
              <input
                type="number"
                placeholder="Available slots"
                value={newAvailability.slots}
                onChange={(e) => setNewAvailability({ ...newAvailability, slots: parseInt(e.target.value) || 0 })}
              />
              <button className="add-btn" onClick={handleAddAvailability}>
                Add Availability
              </button>
            </div>

            <h2>Existing Availability</h2>
            <div className="availabilities-list">
              {availabilities.map((avail) => (
                <div key={avail.id} className="availability-item">
                  <div className="availability-info">
                    <strong>{new Date(avail.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</strong>
                    <span>{avail.time}</span>
                    <span>Slots: {avail.slots}</span>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteAvailability(avail.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="admin-content">
            <h2>Appointments (Queue Order by Date)</h2>
            <div className="appointments-list">
              {appointments.length === 0 ? (
                <div className="empty-state">No appointments</div>
              ) : (
                appointments
                  .sort((x, y) => {
                    const dateCompare = x.date.localeCompare(y.date);
                    if (dateCompare !== 0) return dateCompare;
                    return (Number(x.queueNumber || 0) - Number(y.queueNumber || 0));
                  })
                  .map((a) => (
                    <div key={a.id} className="appointment-item">
                      <div className="appointment-info">
                        <strong>{a.name}</strong>
                        <span>{a.service}</span>
                        <span>{a.date} {a.time || ''}</span>
                        <span>{a.email}</span>
                        <span>Queue #{a.queueNumber || '-'}</span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
