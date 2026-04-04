import { Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./features/auth/authStore";

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const ensureProfile = useAuthStore((s) => s.ensureProfile);

  useEffect(() => {
    if (isAuthenticated) {
      void ensureProfile();
    }
  }, [isAuthenticated, ensureProfile]);

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
