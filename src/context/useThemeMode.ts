import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from './themeContextInstance';

export function useThemeMode(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeMode must be used within AppThemeProvider');
  return ctx;
}
