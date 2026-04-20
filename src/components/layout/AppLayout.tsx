import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  IconButton,
  Button,
  Tooltip,
} from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LogoutIcon from "@mui/icons-material/Logout";
import AppSidebar from "./AppSidebar";
import LogoutConfirmDialog from "./LogoutConfirmDialog";
import { useApp } from "../../context/useApp";
import { useThemeMode } from "../../context/useThemeMode";
import {
  ENVIRONMENT_OPTIONS,
  getActiveEnvironmentType,
  setActiveEnvironmentType,
  type EnvironmentType,
} from "../../constants/environment";

const COLLAPSE_KEY = "awe_sidebar_collapsed";

function isEnvironmentSwitchEnabled(pathname: string): boolean {
  return (
    pathname === "/workflows" ||
    pathname === "/instances" ||
    pathname === "/tasks" ||
    pathname === "/audit" ||
    pathname === "/dashboard"
  );
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(COLLAPSE_KEY) === "true";
  });
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [selectedEnvironmentType, setSelectedEnvironmentType] =
    useState<EnvironmentType>(() => getActiveEnvironmentType());
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useApp();
  const { mode, toggleTheme } = useThemeMode();
  const canSwitchEnvironment = isEnvironmentSwitchEnabled(location.pathname);

  const toggleCollapse = (value: boolean) => {
    setCollapsed(value);
    localStorage.setItem(COLLAPSE_KEY, String(value));
  };

  const handleEnvironmentChange = (environmentType: EnvironmentType) => {
    if (!canSwitchEnvironment) return;
    setActiveEnvironmentType(environmentType);
    setSelectedEnvironmentType(environmentType);
    window.location.reload();
  };

  return (
    <Box
      display="flex"
      sx={{ minHeight: "100vh", backgroundColor: "background.default" }}
    >
      <AppSidebar
        collapsed={collapsed}
        activePath={location.pathname}
        userName={user?.name}
        userEmail={user?.email}
        onNavigate={navigate}
        onToggleCollapse={toggleCollapse}
      />

      <LogoutConfirmDialog
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          logout();
        }}
      />

      <Box
        component="main"
        sx={{
          flex: 1,
          overflowY: "auto",
          minHeight: "100vh",
          backgroundColor: "background.default",
        }}
      >
        <Box
          sx={{
            minHeight: 52,
            border: "1px solid",
            borderColor: "divider",
            px: { xs: 1, md: 1.5 },
            display: "flex",
            alignItems: "center",
            gap: 1,
            background:
              "linear-gradient(90deg, rgba(79,110,247,0.08) 0%, rgba(79,110,247,0.03) 45%, transparent 100%)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "action.hover",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: "12px",
              p: "3px",
              gap: "2px",
            }}
          >
            {ENVIRONMENT_OPTIONS.map((environmentType) => {
              const isActive = selectedEnvironmentType === environmentType;
              const dotColor =
                environmentType === "production"
                  ? "#22c55e"
                  : environmentType === "staging"
                    ? "#f59e0b"
                    : "#6366f1";

              return (
                <Box
                  key={environmentType}
                  component="button"
                  onClick={() => handleEnvironmentChange(environmentType)}
                  disabled={!canSwitchEnvironment}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    px: 1.5,
                    py: "5px",
                    borderRadius: "9px",
                    border: isActive ? "1px solid" : "1px solid transparent",
                    borderColor: isActive ? "divider" : "transparent",
                    backgroundColor: isActive
                      ? "background.paper"
                      : "transparent",
                    color: isActive ? "text.primary" : "text.secondary",
                    fontSize: 12.5,
                    fontWeight: 500,
                    cursor: canSwitchEnvironment ? "pointer" : "not-allowed",
                    textTransform: "capitalize",
                    transition: "all 0.15s",
                    opacity: canSwitchEnvironment ? 1 : 0.45,
                    "&:hover": {
                      color: "text.primary",
                      backgroundColor: "background.paper",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      backgroundColor: dotColor,
                      flexShrink: 0,
                    }}
                  />
                  {environmentType}
                </Box>
              );
            })}
          </Box>

          <Box sx={{ flex: 1 }} />

          <Tooltip
            title={
              mode === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            <IconButton
              size="small"
              onClick={toggleTheme}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "10px",
              }}
            >
              {mode === "dark" ? (
                <LightModeIcon fontSize="small" />
              ) : (
                <DarkModeIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

          <Button
            size="small"
            startIcon={<LogoutIcon sx={{ fontSize: 16 }} />}
            onClick={() => setLogoutConfirmOpen(true)}
            sx={{
              height: 34,
              px: 1.25,
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              border: "1px solid",
              borderColor: "divider",
              color: "text.secondary",
              "&:hover": {
                color: "text.primary",
                borderColor: "text.disabled",
                backgroundColor: "action.hover",
              },
            }}
          >
            Logout
          </Button>
        </Box>

        <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
