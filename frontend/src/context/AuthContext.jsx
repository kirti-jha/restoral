import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context || { user: null, loading: true, login: () => {}, logout: () => {}, refreshUser: () => {} };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!token) {
      return null;
    }

    try {
      const { data } = await api.get('/auth/me');
      if (data.success) {
        setUser(data.user);
        return data.user;
      }
    } catch {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      setUser(null);
    }

    return null;
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const url = new URL(window.location.href);
      const impersonationToken = url.searchParams.get('impersonationToken');

      if (impersonationToken) {
        sessionStorage.setItem('token', impersonationToken);
        url.searchParams.delete('impersonationToken');
        window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
      }

      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (token) {
        await refreshUser();
      }
      setLoading(false);
    };
    initAuth();
  }, [refreshUser]);

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email: email.trim(), password });
      if (data.success) {
        // Normal sign-ins should use shared persistent auth.
        sessionStorage.removeItem('token');
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err) {
      console.error('Login error:', err);
      const message =
        err.response?.data?.message ||
        (err.request
          ? 'Unable to reach the server. Make sure the backend is running and the API URL is correct.'
          : 'Login failed. Please try again.');
      return { success: false, message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    login,
    logout,
    refreshUser,
    loading
  }), [user, login, logout, refreshUser, loading]);

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
