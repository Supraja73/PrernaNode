import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAccessToken } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check for an existing session

  // On first load, try to silently refresh using the httpOnly cookie.
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        setAccessToken(data.data.accessToken);
        const me = await api.get('/auth/me');
        setUser(me.data.data);
        connectSocket();
      } catch (err) {
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = useCallback(async (email, password, rememberMe = false) => {
    const { data } = await api.post('/auth/login', { email, password, rememberMe });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    connectSocket();
    return data.data.user;
  }, []);

  const register = useCallback(async (name, username, email, password) => {
    const { data } = await api.post('/auth/register', { name, username, email, password });
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
      disconnectSocket();
    }
  }, []);

  const refreshMe = useCallback(async () => {
    const me = await api.get('/auth/me');
    setUser(me.data.data);
    return me.data.data;
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
};
