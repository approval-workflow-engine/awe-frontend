import { createContext } from 'react';
import type { User } from '../types';

export interface AppContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User, accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  updateUser: (userData: User) => void;
}

export const AppContext = createContext<AppContextValue | null>(null);
