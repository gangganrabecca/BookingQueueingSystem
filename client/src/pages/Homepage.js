import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Homepage.css';

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="menu-svg-icon"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="menu-svg-icon"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="menu-svg-icon"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
);

const ListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="menu-svg-icon"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
);

const MapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="menu-svg-icon"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>
);

const Homepage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'booking', title: 'Booking Appointment', icon: <CalendarIcon />, path: '/booking' },
    { id: 'manage', title: 'Manage Appointment', icon: <EditIcon />, path: '/manage-appointment' },
    { id: 'queue', title: 'Queue', icon: <UsersIcon />, path: '/queue' },
    { id: 'services', title: 'Services', icon: <ListIcon />, path: '/services' },
    { id: 'map', title: 'Map', icon: <MapIcon />, path: '/map' },
  ];

  return (
    <div className="homepage-container">
      <div className="homepage-header">
        <div className="header-content">
          <h1>Municipal Registrar</h1>
          <p>Bongao</p>
        </div>
        <div className="header-actions">
          {user?.role === 'admin' && (
            <button className="admin-btn" onClick={() => navigate('/admin')}>
              Admin
            </button>
          )}
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div className="homepage-content">
        <div className="welcome-section">
          <h2>Welcome, {user?.name}!</h2>
          <p>Select a service to get started</p>
        </div>

        <div className="menu-grid">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="menu-card"
              onClick={() => navigate(item.path)}
            >
              <div className="menu-icon">{item.icon}</div>
              <div className="menu-title">{item.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Homepage;
