import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Role } from '../types.js';            // will exist in your types.js
import { api } from '../services/api.js';            // placeholder for backend API calls
import Spinner from '../components/common/Spinner.jsx';  // we’ll integrate later

export const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async () => {
    try {
      if (localStorage.getItem('authToken')) {
        // Validate token by calling the profile endpoint
        const response = await api.getProfile();
        setUser(response.user);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      // Token expired or invalid - clear storage and logout
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setToken(localStorage.getItem('authToken'));
    fetchUserProfile();
  }, [fetchUserProfile]);

  const login = (newToken, userData) => {
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    window.location.hash = '/login';
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated: !!token,
    isAdmin: user?.role === Role.ADMIN, // Role will be defined in types.js
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
