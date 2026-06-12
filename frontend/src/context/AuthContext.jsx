import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [csrfToken, setCsrfToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const data = await apiFetch('/api/me', { method: 'GET' });
      if (data.success) {
        setUser(data.user);
        setCsrfToken(data.csrf_token || null);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (credentials) => {
    const data = await apiFetch('/api/login', { method: 'POST', body: credentials });
    if (data.success) {
      setUser(data.user);
      setCsrfToken(data.csrf_token || null);
    }
    return data;
  };

  const register = async (payload) => {
    const data = await apiFetch('/api/register', { method: 'POST', body: payload });
    if (data.success) {
      setUser(data.user);
      setCsrfToken(data.csrf_token || null);
    }
    return data;
  };

  const logout = async () => {
    try {
      await apiFetch('/api/logout', { method: 'POST', headers: { 'X-CSRF-Token': csrfToken } });
    } finally {
      setUser(null);
      setCsrfToken(null);
    }
  };

  const updateProfile = async (payload) => {
    const data = await apiFetch('/api/profile', {
      method: 'PUT',
      headers: { 'X-CSRF-Token': csrfToken },
      body: payload,
    });
    if (data.success) {
      setUser(data.user);
    }
    return data;
  };

  const changePassword = async (payload) => {
    return apiFetch('/api/change-password', {
      method: 'PUT',
      headers: { 'X-CSRF-Token': csrfToken },
      body: payload,
    });
  };

  const requestPasswordReset = async (payload) => {
    return apiFetch('/api/reset-password-request', { method: 'POST', body: payload });
  };

  const resetPassword = async (payload) => {
    return apiFetch('/api/reset-password', { method: 'POST', body: payload });
  };

  const authFetch = async (path, options = {}) => {
    const headers = { ...options.headers };
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
    return apiFetch(path, { ...options, headers });
  };

  return (
    <AuthContext.Provider value={{ user, csrfToken, loading, login, register, logout, updateProfile, changePassword, requestPasswordReset, resetPassword, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
