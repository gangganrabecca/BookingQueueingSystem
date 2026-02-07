import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

/**
 * Backend API URL
 * Must be set in frontend/.env as:
 * REACT_APP_API_URL=https://booking-backend-r9dc.onrender.com
 */
const API_URL = process.env.REACT_APP_API_URL;

if (!API_URL) {
  console.error('❌ REACT_APP_API_URL is not defined');
}

// Create axios instance instead of using global defaults
const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
});

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Attach token to axios headers
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      delete api.defaults.headers.common['Authorization'];
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await api.get('/api/auth/me');
      setUser(res.data.user);
    } catch (err) {
      console.error('❌ fetchUser failed:', err.response?.data || err.message);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const { token: newToken, user: userData } = res.data;

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      return res.data;
    } catch (err) {
      console.error('❌ Login failed:', err.response?.data || err.message);
      throw err;
    }
  };

  const signup = async (name, email, password) => {
    try {
      const res = await api.post('/api/auth/signup', {
        name,
        email,
        password,
      });

      const { token: newToken, user: userData } = res.data;

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      return res.data;
    } catch (err) {
      console.error('❌ Signup failed:', err.response?.data || err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
