import { Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./features/auth/authStore";

export function PublicOnlyRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated || !!s.accessToken);

  let hasStoredToken = false;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem("auth-storage");
      if (raw) {
        const parsed = JSON.parse(raw) as { state?: { accessToken?: string | null } };
        hasStoredToken = !!parsed?.state?.accessToken;
      }
    } catch {
      hasStoredToken = false;
    }
  }

  return isAuthenticated || hasStoredToken ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

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
