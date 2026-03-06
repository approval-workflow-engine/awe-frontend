import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom";
import { useApp } from "../context/useApp";
import AppLayout from "../components/layout/AppLayout";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegistrationPage";
import Dashboard from "../pages/dashboard/Dashboard";
import WorkflowsPage from "../pages/workflows/WorkflowsPage";
import WorkflowVersionsPage from "../pages/workflows/WorkflowVersionsPage";
import WorkflowBuilder from "../pages/workflows/WorkflowBuilder";
import Settings from "../pages/settings/Settings";

function ProtectedLayout() {
  const { isAuthenticated } = useApp();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppLayout />;
}

function ProtectedFullScreen() {
  const { isAuthenticated } = useApp();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function PublicRoute() {
  const { isAuthenticated } = useApp();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedFullScreen />,
    children: [
      { path: "/workflows/:workflowId/builder", element: <WorkflowBuilder /> },
      { path: "/workflows/:workflowId/builder/:versionNumber", element: <WorkflowBuilder /> },
    ],
  },
  {
    element: <ProtectedLayout />,
    children: [
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/workflows", element: <WorkflowsPage /> },
      { path: "/workflows/:workflowId/versions", element: <WorkflowVersionsPage /> },
      { path: "/instances", element: <Dashboard /> },
      { path: "/tasks", element: <Dashboard /> },
      { path: "/audit", element: <Dashboard /> },
      { path: "/debug", element: <Dashboard /> },
      { path: "/settings", element: <Settings /> },
    ],
  },
  { path: "/", element: <Navigate to="/dashboard" replace /> },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}
