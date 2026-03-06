import { createContext } from 'react';
import type { ThemeMode } from '../types';

export interface ThemeContextValue {
  mode: ThemeMode;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
