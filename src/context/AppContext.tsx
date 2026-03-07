import { useState, useEffect, useCallback, type ReactNode } from 'react';
import axiosClient from '../api/axiosClient';
import type { User } from '../types';
import { AppContext } from './appContextInstance';

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('awe_access_token');
    const storedUser = localStorage.getItem('awe_user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser) as User);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('awe_user');
        localStorage.removeItem('awe_access_token');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((userData: User, accessToken: string, refreshToken: string) => {
    localStorage.setItem('awe_access_token', accessToken);
    localStorage.setItem('awe_refresh_token', refreshToken);
    localStorage.setItem('awe_user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('awe_refresh_token');
      if (refreshToken) {
        await axiosClient.post('/auth/logout', { refreshToken });
      }
    } catch {
      // ignore errors on logout
    } finally {
      ['awe_access_token', 'awe_refresh_token', 'awe_user'].forEach(k =>
        localStorage.removeItem(k)
      );
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const updateUser = useCallback((userData: User) => {
    setUser(userData);
    localStorage.setItem('awe_user', JSON.stringify(userData));
  }, []);

  if (loading) return null;

  return (
    <AppContext.Provider value={{ user, isAuthenticated, login, logout, updateUser }}>
      {children}
    </AppContext.Provider>
  );
}
