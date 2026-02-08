// import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Homepage from './pages/Homepage';
import BookingAppointment from './pages/BookingAppointment';
import ManageAppointment from './pages/ManageAppointment';
import Queue from './pages/Queue';
import Services from './pages/Services';
import Map from './pages/Map';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

// Centralized API URL
export const API_URL = process.env.REACT_APP_API_URL;

function App() {
  console.log('API URL:', API_URL); // optional: debug to check if env variable is working

  return (
    <div className="App">
      <div className="AppShell">
        <AuthProvider>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <div className="AppViewport">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route
                  path="/homepage"
                  element={
                    <PrivateRoute>
                      <Homepage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/booking"
                  element={
                    <PrivateRoute>
                      <BookingAppointment />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/manage-appointment"
                  element={
                    <PrivateRoute>
                      <ManageAppointment />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/queue"
                  element={
                    <PrivateRoute>
                      <Queue />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/services"
                  element={
                    <PrivateRoute>
                      <Services />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/map"
                  element={
                    <PrivateRoute>
                      <Map />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <PrivateRoute adminOnly>
                      <AdminDashboard />
                    </PrivateRoute>
                  }
                />
                <Route path="/" element={<Navigate to="/login" replace />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </div>
    </div>
  );
}

export default App;
