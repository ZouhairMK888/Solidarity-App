import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('solidarity_token'));
  const [loading, setLoading] = useState(true);

  const saveSession = (userData, tokenValue) => {
    setUser(userData);
    setToken(tokenValue);
    localStorage.setItem('solidarity_token', tokenValue);
    localStorage.setItem('solidarity_user', JSON.stringify(userData));
  };

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('solidarity_token');
    localStorage.removeItem('solidarity_user');
  }, []);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem('solidarity_token');
      if (!savedToken) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await authAPI.getMe();
        setUser(data.data.user);
        setToken(savedToken);
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, [clearSession]);

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials);
    saveSession(data.data.user, data.data.token);
    return data;
  };

  const register = async (userData) => {
    const { data } = await authAPI.register(userData);
    saveSession(data.data.user, data.data.token);
    return data;
  };

  const logout = () => clearSession();

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
