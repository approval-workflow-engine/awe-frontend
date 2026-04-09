import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Box } from "@mui/material";
import AppSidebar from "./AppSidebar";
import LogoutConfirmDialog from "./LogoutConfirmDialog";
import { useApp } from "../../context/useApp";
import { useThemeMode } from "../../context/useThemeMode";
import {
  ENVIRONMENT_STORAGE_KEY,
  getActiveEnvironmentType,
  type EnvironmentType,
} from "../../constants/environment";

const COLLAPSE_KEY = "awe_sidebar_collapsed";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(COLLAPSE_KEY) === "true";
  });
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [activeEnvironmentType, setActiveEnvironmentType] =
    useState<EnvironmentType>(() => getActiveEnvironmentType());
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useApp();
  const { mode, toggleTheme } = useThemeMode();

  const toggleCollapse = (value: boolean) => {
    setCollapsed(value);
    localStorage.setItem(COLLAPSE_KEY, String(value));
  };

  const handleEnvironmentChange = (environmentType: EnvironmentType) => {
    if (environmentType === activeEnvironmentType) return;
    localStorage.setItem(ENVIRONMENT_STORAGE_KEY, environmentType);
    setActiveEnvironmentType(environmentType);
    navigate("/workflows");
    window.location.reload();
  };

  return (
    <Box
      display="flex"
      sx={{ minHeight: "100vh", backgroundColor: "background.default" }}
    >
      <AppSidebar
        collapsed={collapsed}
        mode={mode}
        activePath={location.pathname}
        activeEnvironmentType={activeEnvironmentType}
        userName={user?.name}
        userOrgName={user?.orgName}
        userContactEmail={user?.contactEmail}
        onNavigate={navigate}
        onEnvironmentChange={handleEnvironmentChange}
        onToggleCollapse={toggleCollapse}
        onToggleTheme={toggleTheme}
        onOpenLogout={() => setLogoutConfirmOpen(true)}
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
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
