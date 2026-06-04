// src/context/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import api from '../utils/api';
import type { User } from '../types/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refetchUser: () => Promise<void>;
  login: (userData: User, token?: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.data);
      } else {
        setUser(null);
        localStorage.removeItem('token');
      }
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.error('Fetch user error:', error);
      }
      setUser(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('token');
      setUser(null);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const login = (userData: User, token?: string) => {
    if (token) {
      localStorage.setItem('token', token);
    }
    setUser(userData);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, refetchUser: fetchUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
