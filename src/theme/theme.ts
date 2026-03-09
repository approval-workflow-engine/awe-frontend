import { createTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import type { ThemeMode } from '../types';

//  Shared Typography 
const typography = {
  fontFamily: "'DM Sans', sans-serif",
  h1: { fontFamily: "'Syne', sans-serif", fontWeight: 700 },
  h2: { fontFamily: "'Syne', sans-serif", fontWeight: 700 },
  h3: { fontFamily: "'Syne', sans-serif", fontWeight: 700 },
  h4: { fontFamily: "'Syne', sans-serif", fontWeight: 700 },
  h5: { fontFamily: "'Syne', sans-serif", fontWeight: 700 },
  h6: { fontFamily: "'Syne', sans-serif", fontWeight: 700 },
  button: { fontWeight: 500, textTransform: 'none' as const },
};

const shape = { borderRadius: 10 };

//  Dark Theme 
// Slightly lifted from near-black to improve readability while keeping depth
export const darkTheme: Theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#12141c',  // was #0a0b0f - lifted from near-black
      paper: '#181a24',    // was #0f1117
    },
    primary: { main: '#4f6ef7' },
    secondary: { main: '#a855f7' },
    success: { main: '#22c55e' },
    warning: { main: '#f59e0b' },
    error: { main: '#ef4444' },
    info: { main: '#06b6d4' },
    text: {
      primary: '#e8eaf2',
      secondary: '#8b91a8',
      disabled: '#7a7f9e',  // improved contrast from #636882 for readable metadata
    },
    divider: '#22273a',  // was #1f2437
  },
  typography,
  shape,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': { boxSizing: 'border-box' },
        '::-webkit-scrollbar': { width: '5px', height: '5px' },
        '::-webkit-scrollbar-track': { background: 'transparent' },
        '::-webkit-scrollbar-thumb': { background: '#2e3450', borderRadius: '3px' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #22273a',
          borderRadius: '10px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#1c1e2b',  // was #141720
          '& fieldset': { borderColor: '#2a2f45' },
          '&:hover fieldset': { borderColor: '#4f6ef7' },
          '&.Mui-focused fieldset': { borderColor: '#4f6ef7' },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: { root: { color: '#8b91a8' } },
    },
    MuiTableContainer: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& th': {
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#8b91a8',
            backgroundColor: '#1c1e2b',  // was #141720
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: '#1f2133' },  // was #1a1e2e
          '&:last-child td': { borderBottom: 0 },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: { root: { borderColor: '#22273a' } },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: '99px', fontSize: '11px', fontWeight: 600 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#181a24',  // was #0f1117
          borderRight: '1px solid #22273a',
          backgroundImage: 'none',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { border: '1px solid #22273a', backgroundImage: 'none' },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: '#22273a' } },
    },
    MuiLinearProgress: {
      styleOverrides: { root: { height: '2px', borderRadius: 0 } },
    },
    MuiSelect: {
      styleOverrides: { root: { backgroundColor: '#1c1e2b' } },  // was #141720
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: '#1f2133' },  // was #1a1e2e
          '&.Mui-selected': { backgroundColor: 'rgba(79, 110, 247, 0.12)' },
        },
      },
    },
  },
});

//  Light Theme 
export const lightTheme: Theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#f4f6fb',
      paper: '#ffffff',
    },
    primary: { main: '#4f6ef7' },
    secondary: { main: '#a855f7' },
    success: { main: '#16a34a' },
    warning: { main: '#d97706' },
    error: { main: '#dc2626' },
    info: { main: '#0891b2' },
    text: {
      primary: '#111827',
      secondary: '#6b7280',
      disabled: '#7b8899',  // improved contrast from #9ca3af for readable metadata
    },
    divider: '#e5e7eb',
  },
  typography,
  shape,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': { boxSizing: 'border-box' },
        '::-webkit-scrollbar': { width: '5px', height: '5px' },
        '::-webkit-scrollbar-track': { background: 'transparent' },
        '::-webkit-scrollbar-thumb': { background: '#d1d5db', borderRadius: '3px' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #e5e7eb',
          borderRadius: '10px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#f9fafb',
          '& fieldset': { borderColor: '#d1d5db' },
          '&:hover fieldset': { borderColor: '#4f6ef7' },
          '&.Mui-focused fieldset': { borderColor: '#4f6ef7' },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: { root: { color: '#6b7280' } },
    },
    MuiTableContainer: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& th': {
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#6b7280',
            backgroundColor: '#f3f4f6',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: '#f9fafb' },
          '&:last-child td': { borderBottom: 0 },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: { root: { borderColor: '#e5e7eb' } },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: '99px', fontSize: '11px', fontWeight: 600 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          backgroundImage: 'none',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { border: '1px solid #e5e7eb', backgroundImage: 'none' },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: '#e5e7eb' } },
    },
    MuiLinearProgress: {
      styleOverrides: { root: { height: '2px', borderRadius: 0 } },
    },
    MuiSelect: {
      styleOverrides: { root: { backgroundColor: '#f9fafb' } },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: '#f3f4f6' },
          '&.Mui-selected': { backgroundColor: 'rgba(79, 110, 247, 0.08)' },
        },
      },
    },
  },
});

//  Theme Selector 
export function getTheme(mode: ThemeMode): Theme {
  return mode === 'light' ? lightTheme : darkTheme;
}

export const theme = darkTheme;
