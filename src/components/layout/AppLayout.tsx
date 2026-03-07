import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Typography, IconButton, Divider, Avatar, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BugReportIcon from '@mui/icons-material/BugReport';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import Logo from '../common/Logo';
import { useApp } from '../../context/useApp';
import { useThemeMode } from '../../context/useThemeMode';

const EXPANDED_WIDTH = 220;
const COLLAPSED_WIDTH = 64;
const COLLAPSE_KEY = 'awe_sidebar_collapsed';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard',     path: '/dashboard', icon: DashboardIcon },
      { label: 'Workflows',     path: '/workflows',  icon: AccountTreeIcon },
      { label: 'Instances',     path: '/instances',  icon: PlayCircleIcon },
      { label: 'Pending Tasks', path: '/tasks',      icon: AssignmentIcon },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Debug',    path: '/debug',    icon: BugReportIcon },
      { label: 'Audit',    path: '/audit',    icon: SecurityIcon },
      { label: 'Settings', path: '/settings', icon: SettingsIcon },
    ],
  },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(COLLAPSE_KEY) === 'true';
  });
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useApp();
  const { mode, toggleTheme } = useThemeMode();

  const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;
  const isActive = (path: string) => location.pathname.startsWith(path);

  const toggleCollapse = (value: boolean) => {
    setCollapsed(value);
    localStorage.setItem(COLLAPSE_KEY, String(value));
  };

  return (
    <Box display="flex" sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Drawer
        variant="permanent"
        sx={{
          width,
          flexShrink: 0,
          transition: 'width 0.2s ease',
          '& .MuiDrawer-paper': {
            width,
            overflowX: 'hidden',
            transition: 'width 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 0,
          },
        }}
      >
        {/* Logo area */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            px: collapsed ? 0 : 2,
            py: 2,
            minHeight: 64,
          }}
        >
          {!collapsed && (
            <Box display="flex" alignItems="center" gap={1.5}>
              <Logo />
              <Box>
                <Typography sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: 'text.primary', lineHeight: 1 }}>
                  AWE
                </Typography>
                <Typography sx={{ fontSize: '9px', color: 'text.disabled', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.4 }}>
                  v1.0.0
                </Typography>
              </Box>
            </Box>
          )}
          {collapsed && <Logo />}
          {!collapsed && (
            <IconButton onClick={() => toggleCollapse(true)} size="small" sx={{ color: 'text.disabled' }}>
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        {collapsed && (
          <Box display="flex" justifyContent="center" pb={1}>
            <IconButton onClick={() => toggleCollapse(false)} size="small" sx={{ color: 'text.disabled' }}>
              <MenuIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        <Divider />

        {/* Navigation */}
        <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
          {NAV_SECTIONS.map((section, si) => (
            <Box key={si}>
              {!collapsed && (
                <Typography
                  sx={{
                    fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                    letterSpacing: '0.08em', color: 'text.disabled',
                    px: 2, pt: si === 0 ? 1 : 2, pb: 0.5,
                  }}
                >
                  {section.label}
                </Typography>
              )}
              {si > 0 && collapsed && <Divider sx={{ my: 1 }} />}
              <List disablePadding>
                {section.items.map(item => {
                  const active = isActive(item.path);
                  const IconComp = item.icon;
                  const btn = (
                    <ListItemButton
                      onClick={() => navigate(item.path)}
                      sx={{
                        borderRadius: '8px',
                        mx: 1, mb: 0.25,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        minHeight: 40,
                        backgroundColor: active ? 'rgba(79,110,247,0.12)' : 'transparent',
                        '&:hover': {
                          backgroundColor: active ? 'rgba(79,110,247,0.18)' : 'action.hover',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: collapsed ? 0 : 36,
                          color: active ? 'primary.main' : 'text.disabled',
                        }}
                      >
                        <IconComp fontSize="small" />
                      </ListItemIcon>
                      {!collapsed && (
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            fontSize: 13,
                            fontWeight: active ? 600 : 400,
                            color: active ? 'primary.main' : 'text.secondary',
                          }}
                        />
                      )}
                    </ListItemButton>
                  );

                  return (
                    <ListItem key={item.path} disablePadding>
                      {collapsed ? (
                        <Tooltip title={item.label} placement="right">
                          {btn}
                        </Tooltip>
                      ) : btn}
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          ))}
        </Box>

        <Divider />

        {/* Theme toggle */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: collapsed ? 'center' : 'flex-end',
            px: collapsed ? 0 : 1.5,
            py: 0.75,
          }}
        >
          <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} placement="right">
            <IconButton size="small" onClick={toggleTheme} sx={{ color: 'text.disabled', '&:hover': { color: 'text.primary' } }}>
              {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>

        <Divider />

        {/* User row */}
        <Box
          onClick={() => setLogoutConfirmOpen(true)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: collapsed ? 1 : 2,
            py: 1.5,
            cursor: 'pointer',
            justifyContent: collapsed ? 'center' : 'flex-start',
            '&:hover': { backgroundColor: 'action.hover' },
          }}
        >
          <Tooltip title={collapsed ? (user?.name || 'Logout') : ''} placement="right">
            <Avatar
              sx={{
                width: 32, height: 32,
                backgroundColor: 'rgba(79,110,247,0.2)',
                fontSize: 13, fontWeight: 700,
                color: 'primary.main',
                flexShrink: 0,
              }}
            >
              {(user?.name || user?.orgName || 'U')[0].toUpperCase()}
            </Avatar>
          </Tooltip>
          {!collapsed && (
            <Box flex={1} minWidth={0}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || user?.orgName || 'User'}
              </Typography>
              <Typography sx={{ fontSize: 11, color: 'text.disabled', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.contactEmail || ''}
              </Typography>
            </Box>
          )}
          {!collapsed && <LogoutIcon sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />}
        </Box>
      </Drawer>

      {/* Logout Confirmation */}
      <Dialog open={logoutConfirmOpen} onClose={() => setLogoutConfirmOpen(false)} maxWidth="xs" fullWidth >
        <DialogTitle sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>
          Sign out?
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            Are you sure you want to sign out?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={() => setLogoutConfirmOpen(false)} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => { setLogoutConfirmOpen(false); logout(); }}
            sx={{ borderRadius: '8px', fontWeight: 600 }}
          >
            Sign Out
          </Button>
        </DialogActions>
      </Dialog>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          overflowY: 'auto',
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
