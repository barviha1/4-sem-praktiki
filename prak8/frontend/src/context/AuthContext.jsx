import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authAPI.getMe();
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to load user:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      toast.success('Регистрация успешна! Теперь войдите в систему');
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { accessToken, refreshToken } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      const userResponse = await authAPI.getMe();
      setUser(userResponse.data);
      setIsAuthenticated(true);
      toast.success('Вход выполнен успешно!');
      
      return userResponse.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Вы вышли из системы');
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    register,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};