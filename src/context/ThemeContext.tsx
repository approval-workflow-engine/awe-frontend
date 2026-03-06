import { useState, useCallback, useMemo, type ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { darkTheme, lightTheme } from '../theme/theme';
import type { ThemeMode } from '../types';
import { ThemeContext } from './themeContextInstance';

const THEME_KEY = 'awe_theme';

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem(THEME_KEY) as ThemeMode) || 'dark';
  });

  const toggleTheme = useCallback(() => {
    setMode(prev => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ mode, toggleTheme }), [mode, toggleTheme]);
  const theme = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
