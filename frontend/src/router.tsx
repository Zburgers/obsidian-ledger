import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "./features/auth/authStore";

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export function AdminRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Outlet />;
}
