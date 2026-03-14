import { useState, useEffect, useCallback, type ReactNode } from 'react';
import axiosClient from '../api/axiosClient';
import type { User } from '../types';
import { AppContext } from './appContextInstance';
import { TOKEN_KEYS } from '../constants/tokens';

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEYS.ACCESS);
    const storedUser = localStorage.getItem(TOKEN_KEYS.USER);
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser) as User);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem(TOKEN_KEYS.USER);
        localStorage.removeItem(TOKEN_KEYS.ACCESS);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((userData: User, accessToken: string, refreshToken: string) => {
    localStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
    localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH);
      if (refreshToken) {
        await axiosClient.post('/auth/logout', { refreshToken });
      }
    } catch {
    } finally {
      Object.values(TOKEN_KEYS).forEach(k => localStorage.removeItem(k));
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const updateUser = useCallback((userData: User) => {
    setUser(userData);
    localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(userData));
  }, []);

  if (loading) return null;

  return (
    <AppContext.Provider value={{ user, isAuthenticated, login, logout, updateUser }}>
      {children}
    </AppContext.Provider>
  );
}
