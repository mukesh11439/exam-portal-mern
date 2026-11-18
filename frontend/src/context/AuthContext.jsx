import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('exam-portal-user') || 'null');
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem('exam-portal-token');
    localStorage.removeItem('exam-portal-user');
    setUser(null);
  }, []);

  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, [logout]);

  const authenticate = useCallback(async (endpoint, credentials) => {
    setLoading(true);
    try {
      const { data } = await api.post(`/auth/${endpoint}`, credentials);
      localStorage.setItem('exam-portal-token', data.token);
      localStorage.setItem('exam-portal-user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    login: (credentials) => authenticate('login', credentials),
    register: (credentials) => authenticate('register', credentials),
    logout
  }), [user, loading, authenticate, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

