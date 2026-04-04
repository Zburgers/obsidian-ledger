import { Routes, Route, Navigate, NavLink, useLocation } from "react-router-dom";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { UsersPage } from "./features/users/UsersPage";
import { RecordsPage } from "./features/records/RecordsPage";
import { RecordForm } from "./features/records/RecordForm";
import { RecordDetailPage } from "./features/records/RecordDetailPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { ProtectedRoute, AdminRoute } from "./router";
import { useState, useCallback, type ReactNode } from "react";
import { useAuthStore } from "./features/auth/authStore";

function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const role = useAuthStore((s) => s.role);
  const email = useAuthStore((s) => s.email);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="app-shell">
      <div className="topbar-wrap">
        <header className="topbar" aria-label="Main navigation">
          <div className="brand">FinTrack</div>
          <nav className="topbar-nav">
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
              Dashboard
            </NavLink>
            <NavLink to="/records" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
              Records
            </NavLink>
            {role === "admin" && (
              <NavLink to="/users" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
                Users
              </NavLink>
            )}
          </nav>
          <div className="topbar-right">
            {role && <span className="role-chip">{role}</span>}
            <span>{email ?? "Signed in"}</span>
            {location.pathname !== "/login" && (
              <button type="button" onClick={logout} className="btn-ghost">
                Logout
              </button>
            )}
          </div>
        </header>
      </div>
      <main className="page-wrap">{children}</main>
    </div>
  );
}

export function App() {
  const role = useAuthStore((s) => s.role);
  const canCreateRecords = role === "admin";
  const [recordsView, setRecordsView] = useState<"list" | "create" | "detail">("list");
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const handleViewRecord = useCallback((id: string) => {
    setSelectedRecordId(id);
    setRecordsView("detail");
  }, []);

  const handleCreateRecord = useCallback(() => {
    setRecordsView("create");
  }, []);

  const handleBackToList = useCallback(() => {
    setRecordsView("list");
    setSelectedRecordId(null);
  }, []);

  const handleRecordSuccess = useCallback(() => {
    setRecordsView("list");
    setSelectedRecordId(null);
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<AppLayout><DashboardPage /></AppLayout>} />
        <Route path="/records" element={
          <AppLayout>
            {recordsView === "list" ? (
              <RecordsPage onCreate={canCreateRecords ? handleCreateRecord : undefined} onView={handleViewRecord} />
            ) : recordsView === "create" && canCreateRecords ? (
              <RecordForm onSuccess={handleRecordSuccess} onCancel={handleBackToList} />
            ) : selectedRecordId ? (
              <RecordDetailPage recordId={selectedRecordId} onBack={handleBackToList} />
            ) : null}
          </AppLayout>
        } />
      </Route>
      <Route element={<AdminRoute />}>
        <Route path="/users" element={<AppLayout><UsersPage /></AppLayout>} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
