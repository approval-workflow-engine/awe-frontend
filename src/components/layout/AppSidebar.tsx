import React from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import AssignmentIcon from "@mui/icons-material/Assignment";
import SecurityIcon from "@mui/icons-material/Security";
import SettingsIcon from "@mui/icons-material/Settings";
import LockIcon from "@mui/icons-material/Lock";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuIcon from "@mui/icons-material/Menu";
import Logo from "../common/Logo";

const EXPANDED_WIDTH = 196;
const COLLAPSED_WIDTH = 60;

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: DashboardIcon },
  { label: "Workflows", path: "/workflows", icon: AccountTreeIcon },
  { label: "Instances", path: "/instances", icon: PlayCircleIcon },
  { label: "Pending Tasks", path: "/tasks", icon: AssignmentIcon },
  { label: "Audit", path: "/audit", icon: SecurityIcon },
  { label: "Secrets", path: "/secrets", icon: LockIcon },
  { label: "Settings", path: "/settings", icon: SettingsIcon },
];

interface AppSidebarProps {
  collapsed: boolean;
  activePath: string;
  userName?: string;
  userEmail?: string;
  onNavigate: (path: string) => void;
  onToggleCollapse: (collapsed: boolean) => void;
}

export default function AppSidebar({
  collapsed,
  activePath,
  onNavigate,
  onToggleCollapse,
}: AppSidebarProps) {
  const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  const isActive = (path: string) => activePath.startsWith(path);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        transition: "width 0.2s ease",
        "& .MuiDrawer-paper": {
          width,
          overflowX: "hidden",
          transition: "width 0.2s ease",
          display: "flex",
          flexDirection: "column",
          borderRadius: 0,
          borderRight: "1px solid",
          borderColor: "divider",
          backgroundColor: "background.paper",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          px: collapsed ? 0 : 2,
          py: 2,
          minHeight: 64,
        }}
      >
        {!collapsed && (
          <Box display="flex" alignItems="center" gap={1.5}>
            <Logo />
            <Box>
              <Typography
                sx={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: 18,
                  color: "text.primary",
                  lineHeight: 1,
                }}
              >
                AWE
              </Typography>
            </Box>
          </Box>
        )}
        {collapsed && (
          <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
            <Logo />
            <Box>
              <Typography
                sx={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: 12,
                  color: "text.primary",
                  lineHeight: 1,
                }}
              >
                AWE
              </Typography>
            </Box>
          </Box>
        )}

        {!collapsed && (
          <IconButton
            onClick={() => onToggleCollapse(true)}
            size="small"
            sx={{ color: "text.disabled" }}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {collapsed && (
        <Box display="flex" justifyContent="center" pb={1}>
          <IconButton
            onClick={() => onToggleCollapse(false)}
            size="small"
            sx={{ color: "text.disabled" }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      <Box sx={{ flex: 1, overflowY: "auto", pb: 1 }}>
        <List disablePadding>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            const IconComp = item.icon;
            const navButton = (
              <ListItemButton
                onClick={() => onNavigate(item.path)}
                sx={{
                  borderRadius: "8px",
                  mx: 1,
                  mb: 0.25,
                  justifyContent: collapsed ? "center" : "flex-start",
                  minHeight: 40,
                  backgroundColor: active
                    ? "rgba(79,110,247,0.12)"
                    : "transparent",
                  "&:hover": {
                    backgroundColor: active
                      ? "rgba(79,110,247,0.18)"
                      : "action.hover",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? 0 : 36,
                    color: active ? "primary.main" : "text.disabled",
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
                      color: active ? "primary.main" : "text.secondary",
                    }}
                  />
                )}
              </ListItemButton>
            );

            return (
              <ListItem key={item.path} disablePadding>
                {collapsed ? (
                  <Tooltip title={item.label} placement="right">
                    {navButton}
                  </Tooltip>
                ) : (
                  navButton
                )}
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Drawer>
  );
}
